const { stripIndents } = require('@webformula/pax-core');
const TilePaletteChecker = require('./TilePaletteChecker');

module.exports = class CanvasToGameboyC {
  constructor(canvasElement, paletteToolElement) {
    this.canvas = canvasElement;
    this.paletteTool = paletteToolElement;
    const { rawPixelData } = canvasElement.getTileData();
    this.rawPixelData = rawPixelData;
    this.palettes = paletteToolElement.palettes;
    this.tileWidth = canvasElement.tileWidth;
    this.tileHeight = canvasElement.tileHeight;

    this.tilePaletteChecker = new TilePaletteChecker(canvasElement, paletteToolElement);
  }

  process(fileName, varName) {
    this.validityData = this.tilePaletteChecker.check();
    if (this.validityData.valid === false) throw Error('You have invalid tiles, pleach check "Tile validation mode"');

    const palettes = this.createPaletteForFile();
    const tilePaletteArray = this.createTilePaletteArray();
    const pixelsByIndexedPaletteColor = this.convertPixelsToIndexedColor(this.rawPixelData, palettes);
    const tileArray = this.createTileArray(pixelsByIndexedPaletteColor);
    const dedupedTiles = this.dedupTiles(tileArray);
    const flattenedTiles = dedupedTiles.reduce((a, b) => a.concat(b), []);
    return this.formatFile(fileName, varName, palettes, tilePaletteArray, flattenedTiles);
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

  createTileArray(pixelData) {
    const pixelsY = this.canvas.height;
    const pixelsX = this.canvas.width;
    const tileWidth = this.canvas.tileWidth;
    const tileHeight = this.canvas.tileHeight;
    const tilesX = pixelsX / tileWidth;
    const tilesY = pixelsY / tileHeight;
    const pixelsPerTile = tileWidth * tileHeight;

    // create empty nested array for all tiles
    let arr = [...new Array(tileWidth * tileHeight)].map(() => []);
    let y = 0;
    let x;
    let z;
    let tile;
    let startingPixel;

    // loop through tiles
    for (;y < tilesY; y += 1) {
      for (x = 0; x < tilesX; x += 1) {
        tile = (y * tilesX) + x;

        // loop thorugh each row in tile
        // here we are going to process each row and store it in sub tile array
        for(z = 0; z < tileHeight; z += 1) {
          // get staring pixel for flat pixel data array
          startingPixel = tile * pixelsPerTile + (z * tileWidth);
          arr[tile] = arr[tile].concat(this.createTilePixelRow(pixelData.slice(startingPixel, startingPixel + tileWidth)));
          // arr = arr.concat(this.createTilePixelRow(pixelData.slice(startingPixel, startingPixel + tileWidth)));
        }
      }
    }

    return arr;
  }

  dedupTiles(nestedTiles) {
    let length = nestedTiles.length;
    let i = 0;
    let j;
    let arr;

    for(; i < length; i += 1) {
      arr.push(nestedTiles[i]);

      for(j = i + 1; j < length; j += 1) {
        if (compareTiles(nestedTiles[i], nestedTiles[j])) {
          // splice from array
          nestedTiles.splice(j, 1);
          length -= 1;
        }
      }
    }

    return nestedTiles;
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

  convertToRGBInt(rgba) {
    return (rgba[0] >> 3) | ((rgba[1] >> 3) << 5) | ((rgba[2] >> 3) << 10);
  }

  convertPixelsToIndexedColor(rawPixelData, palettes) {
    const tilePixelCount = this.canvas.tileWidth * this.canvas.tileHeight;
    return rawPixelData
      .map(rgba => this.convertToRGBInt(rgba))
      .map((cint, i) => {
        const palette = palettes[this.validityData.tileValidationData[Math.floor(i / tilePixelCount)].palette];
        return this.matchColorToPalette(cint, palette);
      });
  }

  matchColorToPalette(cint, palette) {
    return palette.indexOf(cint);
  }

  formatFile(fileName, varName, palettes, tilePaletteArray, tileArray) {
    const hFile = this.formatHFile(fileName, varName, palettes, tilePaletteArray, tileArray);
    const cFile = this.formatCFile(fileName, varName, palettes, tilePaletteArray, tileArray);

    return { hFile, cFile };
  }

  formatCFile(fileName, varName, palettes, tilePaletteArray, tileArray) {
    const tileCount = tilePaletteArray.length;
    return stripIndents`
      ${this.getComentBlock(fileName, tileCount, this.canvas.tileWidth, this.canvas.tileHeight, 'c')}

      ${stripIndents`
      /* CGBpalette entries. */
      unsigned char ${varName}PaletteEntries[${tileCount}] = {
        ${tilePaletteArray.join(',')}
      };

      /* Start of tile array. */
      unsigned char ${varName}[${tileArray.length}] = {
        ${tileArray.join(',')}
      };
      `}
    `;
  }

  formatHFile(fileName, varName, palettes, tilePaletteArray, tileArray) {
    return stripIndents`
      ${this.getComentBlock(fileName, tilePaletteArray.length, this.canvas.tileWidth, this.canvas.tileHeight, 'h')}

      ${palettes.map((palette, i) => {
        return stripIndents`
          /* Gameboy Color palette ${i} */
          #define ${varName}CGBPal${i}c0 ${palette[0]}
          #define ${varName}CGBPal${i}c1 ${palette[1]}
          #define ${varName}CGBPal${i}c2 ${palette[2]}
          #define ${varName}CGBPal${i}c3 ${palette[3]}
        `;
      }).join('\n')}

      ${stripIndents`
      /* CGBpalette entries. */
      extern unsigned char ${varName}PaletteEntries[];

      /* Start of tile array. */
      extern unsigned char ${varName}[];
      `}
    `;
  }

  getComentBlock(fileName, tileCount, tileWidth, tileHeight, type = c) {
    return stripIndents`
      /*
       ${fileName}.${type}

       Tile Source File.

       Info:
        Tile size            : ${tileWidth} x ${tileHeight}
        Tiles                : ${tileCount}
        CGB Palette          : 1 Byte per entry.
      */
    `;
  }
};
