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
      tileMap,
      tileDataCount,
      tilesX,
      tilesY,
      mapCount
    } = this.canvasToFileCore.process(fileName, varName, tileOffset, paletteOffset);

    const header = this.formatHeader(fileName, palettes.length, tileDataCount, tileWidth, tileHeight, tileOffset, paletteOffset, includePalette, includeMap);
    const tileData = this.formatTileData(varName, palettes, tilePaletteArray, tileArray, tileDataCount, tilesX, tilesY);
    const tileDataH = this.formatTilesH(varName, palettes, tileDataCount, tilesX, tilesY, mapCount, tileOffset, paletteOffset);

    let zFile = `${header}\n${tileData}\n`;
    let hFile = `${header}\n${tileDataH}\n`;

    if (includeMap) {
      const mapData = this.formatMapData(varName, tileMap, tilePaletteArray);
      const mapH = this.formatMapH(varName);

      zFile += `${mapData}\n`;
      hFile += `${mapH}\n`;
    }

    return {
      zFile,
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

  formatTileData(varName, palettes, tilePaletteArray, tileArray, tileDataCount, tilesX, tilesY) {
    return stripIndents`
      ${varName}tileWidth EQU $${this.canvas.tileWidth.toString(16)}
      ${varName}tileHeight EQU $${this.canvas.tileHeight.toString(16)}
      ${varName}tileDataCount EQU $${tileDataCount.toString(16)}
      ${varName}tileMapCount EQU $${tileArray.length.toString(16)}
      ${varName}tilesX = $${tilesX.toString(16)};
      ${varName}tilesY = $${tilesY.toString(16)};
      ${varName}Size EQU $${tilePaletteArray.length.toString(16)}
      ${varName}Size EQU $${tileArray.length.toString(16)}

      ; CGBTile entries.
      ${varName}::
      ${this.canvasToFileCore.sliceJoinArr(tileArray.map(v => v.replace('0x', '$')), 16, 'DB ')}
    `;
  }

  formatMapData(varName, mapping, tilePaletteArray) {
    return stripIndents`
      ; CGBpalette entries.
      ${varName}PaletteEntries::
      ${this.canvasToFileCore.sliceJoinArr(tilePaletteArray.map(v => v.replace('0x', '$')), 8, 'DB ')}

      /* map array. */
      ${varName}MapLength EQU $${mapping.length.toString(16)}
      ${varName}Map::
      ${this.canvasToFileCore.sliceJoinArr(mapping.map(v => v.replace('0x', '$')), 8, 'DB ')}
    `;
  }

  formatMapH(varName) {
    return stripIndents`
      /* CGBpalette entries. */
      extern unsigned char ${varName}PaletteEntries[];

      /* map array. */
      extern unsigned char ${varName}Map[];
    `;
  }

  formatTilesH(varName, palettes, tileDataCount, tilesX, tilesY, mapCount, tileOffset, paletteOffset) {
    return stripIndents`
      /* properties */
      #define ${varName}tileWidth ${this.canvas.tileWidth}
      #define ${varName}tileHeight ${this.canvas.tileHeight}
      #define ${varName}tilesX ${tilesX}
      #define ${varName}tilesY ${tilesY}
      #define ${varName}tileDataCount ${tileDataCount}
      #define ${varName}tileMapCount ${mapCount}
      #define ${varName}tileOffset ${tileOffset}
      #define ${varName}PaletteOffset ${paletteOffset}

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
    `;
  }
};
