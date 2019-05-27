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
    const tileHFile = this.formatHFile(fileName, varName, palettes, tilePaletteArray, tileArray);
    const tileMapHFile = this.formatHMapFile(fileName, varName, tileMap);

    return {
      tileFile,
      tileHFile,
      tileMapFile,
      tileMapHFile
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

  formatFile(fileName, varName, palettes, tilePaletteArray, tileArray, codeArea = 1) {
    const tileCount = tilePaletteArray.length;
    return stripIndents`
      ${this.getComentBlock(fileName, tileCount, this.canvas.tileWidth, this.canvas.tileHeight, 'c')}

      ${stripIndents`
      .area _CODE_${codeArea}

      .globl _${varName}
      .dw _${varName}
      .globl _${varName}PaletteEntries
      .dw _${varName}PaletteEntries

      .globl _${varName}tileWidth
      _${varName}tileWidth .equ ${this.canvas.tileWidth.toString(16)}
      .globl _${varName}tileHeight
      _${varName}tileHeight .equ ${this.canvas.tileHeight.toString(16)}
      .globl _${varName}tileCount
      _${varName}tileCount .equ ${tilePaletteArray.length.toString(16)}
      .globl _${varName}Size
      _${varName}Size .equ ${tilePaletteArray.length.toString(16)}
      .globl _${varName}TileCount
      _${varName}TileCount .equ ${tileArray.length.toString(16)}

      ; CGBpalette entries.
      _${varName}PaletteEntries:
      ${this.canvasToFileCore.sliceJoinArr(tilePaletteArray, 8, '.db ')}

      _${varName}:
      ${this.canvasToFileCore.sliceJoinArr(tileArray, 16, '.db ')}
      `}
    `;
  }

  formatHFile(fileName, varName, mapping) {
    return stripIndents`
      ${this.getComentBlock(`${fileName}Map`, mapping.length, this.canvas.tileWidth, this.canvas.tileHeight, 'h')}

      ${stripIndents`
      /* map array. */
      extern UINT8 ${varName}tileWidth;
      extern UINT8 ${varName}tileHeight;
      extern UINT8 ${varName}tileCount;
      extern unsigned char ${varName}PaletteEntries[];
      extern unsigned char ${varName}[];
      `}
    `;
  }

  formatMapFile(fileName, varName, mapping) {
    const tileCount = mapping.length;
    return stripIndents`
      ${this.getComentBlock(`${fileName}Map`, tileCount, this.canvas.tileWidth, this.canvas.tileHeight, 'c')}

      ${stripIndents`
      /* map array. */
      .globl _${varName}Map
      .dw _${varName}Map

      _${varName}MapLength .equ ${mapping.length.toString(16)}
      _${varName}Map:
      ${this.canvasToFileCore.sliceJoinArr(mapping, 8, '.db ')}
      `}
    `;
  }

  formatHMapFile(fileName, varName, mapping) {
    return stripIndents`
      ${this.getComentBlock(`${fileName}Map`, mapping.length, this.canvas.tileWidth, this.canvas.tileHeight, 'h')}

      ${stripIndents`
      /* map array. */
      extern UINT8 ${varName}MapLength;
      extern unsigned char ${varName}Map[];
      `}
    `;
  }
};
