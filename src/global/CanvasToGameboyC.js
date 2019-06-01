const { stripIndents } = require('@webformula/pax-core');
const CanvasToFileCore = require('./CanvasToFileCore');

module.exports = class CanvasToGameboyC {
  constructor(canvasElement, paletteToolElement) {
    this.canvas = canvasElement;
    this.canvasToFileCore = new CanvasToFileCore(canvasElement, paletteToolElement);
  }

  format(fileName, varName) {
    const {
      canvas,
      tileWidth,
      tileHeight,
      palettes,
      tilePaletteArray,
      tileArray,
      tileMap
    } = this.canvasToFileCore.process(fileName, varName);

    const tileFile = this.formatCFile(fileName, varName, palettes, tilePaletteArray, tileArray);
    const tileMapFile = this.formatCMapFile(fileName, varName, tileMap, tileArray);
    const tileHFile = this.formatHFile(fileName, varName, palettes, tilePaletteArray, tileArray);
    const tileMapHFile = this.formatHMapFile(fileName, varName, tileMap, tileArray);

    return {
      tileFile,
      tileHFile,
      tileMapFile,
      tileMapHFile
    };
  }

  formatCFile(fileName, varName, palettes, tilePaletteArray, tileArray) {
    const tileCount = tilePaletteArray.length;
    const tileDataCount = tileArray.length / (this.canvas.tileWidth * 2);
    return stripIndents`
      ${this.getComentBlock(fileName, tileCount, tileDataCount, this.canvas.tileWidth, this.canvas.tileHeight, 'c')}

      /* CGBpalette entries. */
      unsigned char ${varName}PaletteEntries[${tileCount}] = {
        ${this.canvasToFileCore.sliceJoinArr(tilePaletteArray, 8, '', ',').replace(/,\s*$/, "")}
      };

      /* Start of tile array. */
      unsigned char ${varName}[${tileArray.length}] = {
        ${this.canvasToFileCore.sliceJoinArr(tileArray, 16, '', ',').replace(/,\s*$/, "")}
      };
    `;
  }

  formatHFile(fileName, varName, palettes, tilePaletteArray, tileArray) {
    const tileDataCount = tileArray.length / (this.canvas.tileWidth * 2);
    return stripIndents`
      ${this.getComentBlock(fileName, tilePaletteArray.length, tileDataCount, this.canvas.tileWidth, this.canvas.tileHeight, 'h')}

      ${palettes.map((palette, i) => {
        return stripIndents`
          /* Gameboy Color palette ${i} */
          #define ${varName}CGBPal${i}c0 ${palette[0]}
          #define ${varName}CGBPal${i}c1 ${palette[1]}
          #define ${varName}CGBPal${i}c2 ${palette[2]}
          #define ${varName}CGBPal${i}c3 ${palette[3]}
        `;
      }).join('\n')}

      /* CGBpalette entries. */
      extern unsigned char ${varName}PaletteEntries[];

      /* Start of tile array. */
      extern unsigned char ${varName}[];
    `;
  }

  formatCMapFile(fileName, varName, mapping, tileArray) {
    const tileCount = mapping.length;
    const tileDataCount = tileArray.length / (this.canvas.tileWidth * 2);
    return stripIndents`
      ${this.getComentBlock(`${fileName}Map`, tileCount, tileDataCount, this.canvas.tileWidth, this.canvas.tileHeight, 'c')}
      ${stripIndents`
      /* map array. */
      unsigned char ${varName}Map[${mapping.length}] = {`}\n` +
      this.canvasToFileCore.sliceJoinArr(mapping, 20, '', ',').replace(/,\s*$/, "") +
      '\n};\n';
  }

  formatHMapFile(fileName, varName, mapping, tileArray) {
    const tileDataCount = tileArray.length / (this.canvas.tileWidth * 2);
    return stripIndents`
      ${this.getComentBlock(`${fileName}Map`, mapping.length, tileDataCount, this.canvas.tileWidth, this.canvas.tileHeight, 'h')}

      /* map array. */
      extern unsigned char ${varName}Map[];
    `;
  }

  getComentBlock(fileName, tileCount, tileDataCount, tileWidth, tileHeight, type = 'c') {
    return stripIndents`
      /*
       ${fileName}.${type}

       Tile Source File.

       Info:
        Tile size            : ${tileWidth} x ${tileHeight}
        TileDataCount        : ${tileDataCount}
        TileMapCount         : ${tileCount}
        map size             : ${Math.floor(this.canvas.width / tileWidth)} x ${Math.floor(this.canvas.height / tileHeight)}
        CGB Palette          : 1 Byte per entry.
      */
    `;
  }
};
