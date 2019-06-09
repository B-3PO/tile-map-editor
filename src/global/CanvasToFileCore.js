const TilePaletteChecker = require('./TilePaletteChecker');

module.exports = class CanvasToFileCore {
  constructor(canvasElement, paletteToolElement) {
    this.canvas = canvasElement;
    this.paletteTool = paletteToolElement;
    const { rawTileData } = canvasElement.getTileData();
    this.rawTileData = rawTileData;
    this.palettes = paletteToolElement.palettes;
    this.tileWidth = canvasElement.tileWidth;
    this.tileHeight = canvasElement.tileHeight;

    this.tilePaletteChecker = new TilePaletteChecker(canvasElement, paletteToolElement);
  }

  sliceJoinArr(arr, sliceIndex, prefix = '', postfix = '') {
    const length = arr.length;
    let i = 0;
    let str = '';

    for (; i < length; i += sliceIndex) {
      str += `${prefix}${arr.slice(i, i + sliceIndex).join(',')}${postfix}\n`;
    }

    return str;
  }

  process(fileName, varName, tileOffset, paletteOffset) {
    this.validityData = this.tilePaletteChecker.check();
    if (this.validityData.valid === false) throw Error('You have invalid tiles, pleach check "Tile validation mode"');

    const palettes = this.createPaletteForFile();
    const tileArray = this.convertTileArray(this.rawTileData, palettes);
    const tilePaletteArray = this.createTilePaletteArray(parseInt(paletteOffset));
    const dedupedTiles = this.dedupTiles(tileArray, tileOffset, paletteOffset);
    const flattenedTiles = dedupedTiles.tiles.reduce((a, b) => a.concat(b), []);
    const tileMap = this.createTileMap(dedupedTiles);
    const tileDataCount = flattenedTiles.length / (this.canvas.tileWidth * 2);
    const tilesX = Math.floor(this.canvas.width / this.canvas.tileWidth);
    const tilesY = Math.floor(this.canvas.height / this.canvas.tileHeight);
    const mapCount = tilesX * tilesY;

    return {
      canvas: this.canvas,
      tileWidth: this.tileWidth,
      tileHeight: this.tileHeight,
      palettes,
      tilePaletteArray,
      tileArray: flattenedTiles,
      tileMap,
      tileDataCount,
      tilesX,
      tilesY,
      mapCount
    };
  }

  createPaletteForFile() {
    return this.palettes.map(palette => palette.map(rgba => this.convertToRGBInt(rgba)));
  }

  createTilePaletteArray(paletteOffset) {
    const { tileData } = this.tilePaletteChecker.check();
    return tileData.map(d => `0x0${parseInt(d.palette) + paletteOffset}`);
    // return tileData.map(d => this.convertNumberToHex(parseInt(d.palette)));
  }

  convertTileArray(tileArray, palettes) {
    const arrLength = tileArray.length;
    const tileWidth = this.canvas.tileWidth;
    const tileHeight = this.canvas.tileHeight;
    const pixelsPerTile = tileWidth * tileHeight;
    const rowsPerTile = pixelsPerTile / tileWidth;
    let i = 0;
    let j;
    let tempArr;
    let startingPixel;
    let palette;
    let convertedRow;

    for(; i < arrLength; i += 1) {
      tempArr = [];
      for (j = 0; j < rowsPerTile; j += 1) {
        startingPixel = j * tileWidth;
        palette = palettes[this.validityData.tileData[i].palette];
        convertedRow = this.convertPixelsToIndexedColor(tileArray[i].slice(startingPixel, startingPixel + tileWidth), palette);
        tempArr = tempArr.concat(this.createTilePixelRow(convertedRow));
      }

      tileArray[i] = tempArr;
    }

    return tileArray;
  }

  convertPixelsToIndexedColor(rgbaArr, palette) {
    return rgbaArr.map(rgba => this.matchColorToPalette(this.convertToRGBInt(rgba), palette));
  }

  arrayUnique(arr) {
    const newArr = [];
    arr.forEach(a => {
      const found = newArr.find(b => this.compareTiles(a, b));
      if (!found) newArr.push(a);
    });
    return newArr;
  }

  dedupTiles(nestedTiles, tileOffset, paletteOffset) {
    tileOffset = parseInt(tileOffset || 0);
    paletteOffset = parseInt(paletteOffset || 0);
    const tiles = this.arrayUnique(nestedTiles);
    const mapping = nestedTiles.map(a => tiles.findIndex(b => this.compareTiles(a, b))).map(v => v + tileOffset);
    const allPaletteArray = this.createTilePaletteArray(paletteOffset);
    const paletteArrayObj = mapping.reduce((a, b) => {
      a[mapping[b]] = allPaletteArray[mapping[b]];
      return a;
    }, {});
    const paletteArray = Object.keys(paletteArrayObj).sort().map(k => paletteArrayObj[k]);
    return { tiles, mapping, paletteArray };
  }

  compareTiles(one, two) {
    return one.join('') === two.join('');
  }

  createTilePixelRow(pixels) {
    let hbits = 0;
    let lbits = 0;
    let x = 0;
    let length = pixels.length;
    let p;

    for (; x < length; x += 1) {
      lbits = lbits << 1;
  		hbits = hbits << 1;

      p = pixels[x];
      if (p === 1 || p === 3) lbits += 1;
      if (p === 2 || p === 3) hbits += 1;
    }

    return [`0x${('00' + lbits.toString(16)).slice(-2).toUpperCase()}`, `0x${('00' + hbits.toString(16)).slice(-2).toUpperCase()}`];
  }

  createTileMap({ mapping }) {
    return Object.keys(mapping).reduce((a, key) => a.concat(`0x${('00' + mapping[key].toString(16)).slice(-2).toUpperCase()}`), []);
  }

  convertNumberToHex(n) {
    return `0x${('00' + n.toString(16)).slice(-2).toUpperCase()}`;
  }

  convertToRGBInt(rgba) {
    return (rgba[0] >> 3) | ((rgba[1] >> 3) << 5) | ((rgba[2] >> 3) << 10);
  }

  matchColorToPalette(cint, palette) {
    return palette.indexOf(cint);
  }

  formatFile(fileName, varName, palettes, tilePaletteArray, tileArray, tileMap) {
    const hFile = this.formatHFile(fileName, varName, palettes, tilePaletteArray, tileArray);
    const cFile = this.formatCFile(fileName, varName, palettes, tilePaletteArray, tileArray);
    const hMapFile = this.formatHMapFile(fileName, varName, tileMap);
    const cMapFile = this.formatCMapFile(fileName, varName, tileMap);
    return { hFile, cFile, hMapFile, cMapFile };
  }
};
