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

  sliceJoinArr(arr, sliceIndex, prefix = '') {
    const length = arr.length;
    let i = 0;
    let str = '';

    for (; i < length; i += sliceIndex) {
      str += `${prefix}${arr.slice(i, i + sliceIndex).join(',')}\n`;
    }

    return str;
  }

  process(fileName, varName) {
    this.validityData = this.tilePaletteChecker.check();
    if (this.validityData.valid === false) throw Error('You have invalid tiles, pleach check "Tile validation mode"');

    const palettes = this.createPaletteForFile();
    const tilePaletteArray = this.createTilePaletteArray();
    const tileArray = this.convertTileArray(this.rawTileData, palettes);

    const flattenedTiles = tileArray.reduce((a, b) => a.concat(b), []);
    const tileMap = this.createTileMap({ mapping: tileArray.reduce((a, b, i) => {
      a[i] = i;
      return a;
    }, {}) });

    // TODO fix dedup`
    // const dedupedTiles = this.dedupTiles(tileArray);
    // const flattenedTiles = dedupedTiles.tiles.reduce((a, b) => a.concat(b), []);
    // const tileMap = this.createTileMap(dedupedTiles);

    return {
      canvas: this.canvas,
      tileWidth: this.tileWidth,
      tileHeight: this.tileHeight,
      palettes,
      tilePaletteArray,
      tileArray: flattenedTiles,
      tileMap
    };
  }

  createPaletteForFile() {
    return this.palettes.map(palette => palette.map(rgba => this.convertToRGBInt(rgba)));
  }

  convertTo32Range(c) {
    return Math.floor((c / 255) * 31);
  }

  createTilePaletteArray() {
    const { tileValidationData } = this.tilePaletteChecker.check();
    return tileValidationData.map(d => `0x0${d.palette}`);
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
        palette = palettes[this.validityData.tileValidationData[i].palette];
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

  dedupTiles(nestedTiles) {
    const indexedTiles = nestedTiles.map((a, i) => a.concat(i));
    const mapping = indexedTiles.reduce((a, b, i) => {
      a[i] = b[b.length-1];
      return a;
    }, {});
    let length = nestedTiles.length;
    let i = 0;
    let j;
    let arr = [];

    for(; i < length; i += 1) {
      arr.push(indexedTiles[i]);

      for (j = i + 1; j < length; j += 1) {
        if (this.compareTiles(indexedTiles[i], indexedTiles[j])) {

          // create mapping of what tiles go where
          mapping[indexedTiles[j][16]] = i;

          // splice from array
          indexedTiles.splice(j, 1);
          length -= 1;
        }
      }
    }

    arr.forEach(a => a.pop());

    return {
      tiles: arr,
      mapping
    };
  }

  compareTiles(one, two) {
    const length = one.length;
    let i = 0;
    let j;

    for(; i < length; i += 1) {
      for(j = 0; j < length; j += 1) {
        if (one[0] !== two[0]) return false;
      }
    }

    return true
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
