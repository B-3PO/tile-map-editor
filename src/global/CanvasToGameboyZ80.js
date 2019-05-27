const { stripIndents } = require('@webformula/pax-core');
const CanvasToFileCore = require('./CanvasToFileCore');

module.exports = class CanvasToGameboyZ80 {
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
    const tileFile = this.formatFile(fileName, varName, palettes, tilePaletteArray, tileArray);
    const tileMapFile = this.formatMapFile(fileName, varName, tileMap);

    return {
      tileFile,
      tileMapFile
    };
  }

  getComentBlock(fileName, tileCount, tileWidth, tileHeight, type = 'z80') {
    return stripIndents`
      ; ${fileName}.${type}

      ; Tile Source File.

      ; Info:
      ;  Tile size            : ${tileWidth} x ${tileHeight}
      ;  Tiles                : ${tileCount}
      ;  CGB Palette          : 1 Byte per entry.
    `;
  }

  formatFile(fileName, varName, palettes, tilePaletteArray, tileArray) {
    const tileCount = tilePaletteArray.length;
    return stripIndents`
      ${this.getComentBlock(fileName, tileCount, this.canvas.tileWidth, this.canvas.tileHeight, 'c')}

      ${stripIndents`

      tileWidth EQU $${this.canvas.tileWidth.toString(16)}
      tileHeight EQU $${this.canvas.tileHeight.toString(16)}
      tileCount EQU $${tilePaletteArray.length.toString(16)}
      ${varName}Size EQU $${tilePaletteArray.length.toString(16)}
      ${varName}Size EQU $${tileArray.length.toString(16)}

      ; CGBpalette entries.
      ${varName}PaletteEntries::
      ${this.canvasToFileCore.sliceJoinArr(tilePaletteArray, 8, 'DB ')}

      ; CGBTile entries.
      ${varName}::

      ${this.canvasToFileCore.sliceJoinArr(tileArray, 16, 'DB ')}
      `}
    `;
  }

  formatMapFile(fileName, varName, mapping) {
    const tileCount = mapping.length;
    return stripIndents`
      ${this.getComentBlock(`${fileName}Map`, tileCount, this.canvas.tileWidth, this.canvas.tileHeight, 'c')}

      ${stripIndents`
      /* map array. */
      ${varName}MapLength EQU $${mapping.length.toString(16)}
      ${varName}Map::
      ${this.canvasToFileCore.sliceJoinArr(mapping, 8, 'DB ')}
      `}
    `;
  }
};
