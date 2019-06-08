const { stripIndents } = require('@webformula/pax-core');
const CanvasToFileCore = require('./CanvasToFileCore');

module.exports = class CanvasToGameboyZ80 {
  constructor(canvasElement, paletteToolElement) {
    this.canvas = canvasElement;
    this.canvasToFileCore = new CanvasToFileCore(canvasElement, paletteToolElement);
  }

  format(fileName, varName, tileOffset, paletteOffset, includeMap, includePalette) {
    const {
      canvas,
      tileWidth,
      tileHeight,
      palettes,
      tilePaletteArray,
      tileArray,
      tileMap
    } = this.canvasToFileCore.process(fileName, varName, tileOffset, paletteOffset);
    const tileDataCount = tileArray.length / (this.canvas.tileWidth * 2);
    const header = this.formatHeader(fileName, palettes.length, tileDataCount, tileWidth, tileHeight, tileOffset, paletteOffset, includePalette, includeMap);
    const tileData = this.formatTileData(varName, palettes, tilePaletteArray, tileArray, tileDataCount);
    const tileDataH = this.formatTilesH(varName, palettes);

    let sFile = `${header}\n${tileData}\n`;
    let hFile = `${header}\n${tileDataH}\n`;

    if (includeMap) {
      const mapData = this.formatMapData(varName, tileMap, tileArray);
      const mapH = this.formatMapH(varName);

      sFile += `${mapData}\n`;
      hFile += `${mapH}\n`;
    }

    console.log(sFile);
    console.log(hFile);

    return {
      sFile,
      hFile
    };
  }

  formatHeader(fileName, tileCount, tileDataCount, tileWidth, tileHeight, tileOffset, paletteOffset, includePalette, includeMap, type = 's') {
    return stripIndents`
      ; ${fileName}.${type}

      ; Info:
      ;  Tile size            : ${tileWidth} x ${tileHeight}
      ;  TileDataCount        : ${tileDataCount}
      ;  TileMapCount         : ${tileCount}
      ;  map size             : ${Math.floor(this.canvas.width / tileWidth)} x ${Math.floor(this.canvas.height / tileHeight)}
      ;  CGB Palette          : 1 Byte per entry.
      ;  tileOffset           : ${tileOffset}
      ;  paletteOffset        : ${paletteOffset}
      ;  Includes palette     : ${!includePalette ? 'false' : 'true'}
      ;  Includes map         : ${!includeMap ? 'false' : 'true'}
    `;
  }

  formatTileData(varName, palettes, tilePaletteArray, tileArray, tileDataCount, codeArea = 1) {
    const tileCount = tilePaletteArray.length;
    return stripIndents`
      .area _CODE_${codeArea}

      .globl _${varName}
      .dw _${varName}
      .globl _${varName}PaletteEntries
      .dw _${varName}PaletteEntries

      .globl _${varName}tileWidth
      _${varName}tileWidth .equ ${this.canvas.tileWidth.toString(16)}
      .globl _${varName}tileHeight
      _${varName}tileHeight .equ ${this.canvas.tileHeight.toString(16)}
      .globl _${varName}tileDataCount
      _${varName}tileCount .equ ${tileDataCount.toString(16)}
      .globl _${varName}tileMapCount
      _${varName}tileMapCount .equ ${tileCount.toString(16)}
      .globl _${varName}Size
      _${varName}Size .equ ${tilePaletteArray.length.toString(16)}

      ; CGBpalette entries.
      _${varName}PaletteEntries:
      ${this.canvasToFileCore.sliceJoinArr(tilePaletteArray, 8, '.db ')}

      _${varName}:
      ${this.canvasToFileCore.sliceJoinArr(tileArray, 16, '.db ')}
    `;
  }

  formatMapData(varName, mapping) {
    return stripIndents`
      /* map array. */
      .globl _${varName}Map
      .dw _${varName}Map

      _${varName}MapLength .equ ${mapping.length.toString(16)}
      _${varName}Map:
      ${this.canvasToFileCore.sliceJoinArr(mapping, 8, '.db ')}
    `;
  }

  formatMapH(varName) {
    return stripIndents`
      extern UINT8 ${varName}tileWidth;
      extern UINT8 ${varName}tileHeight;
      extern UINT8 ${varName}tileDataCount;
      extern UINT8 ${varName}tileMapCount;
      extern unsigned char ${varName}PaletteEntries[];
      extern unsigned char ${varName}[];

      /* map array. */
      extern unsigned char ${varName}Map[];
    `;
  }

  formatTilesH(varName, palettes) {
    return stripIndents`
      ${palettes.map((palette, i) => {
        return stripIndents`
          /* Gameboy Color palette ${i} */
          #define ${varName}CGBPal${i}c0 ${palette[0]}
          #define ${varName}CGBPal${i}c1 ${palette[1]}
          #define ${varName}CGBPal${i}c2 ${palette[2]}
          #define ${varName}CGBPal${i}c3 ${palette[3]}
        `;
      }).join('\n')}

      /* Start of tile array. */
      extern unsigned char ${varName}[];

      /* CGBpalette entries. */
      extern unsigned char ${varName}PaletteEntries[];
    `;
  }
};
