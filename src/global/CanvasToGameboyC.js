const { stripIndents } = require('@webformula/pax-core');
const CanvasToFileCore = require('./CanvasToFileCore');

module.exports = class CanvasToGameboyC {
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
    const tileData = this.formatTileData(varName, tileArray);
    const tileDataH = this.formatTilesH(varName, palettes, tileDataCount, tilesX, tilesY, mapCount, tileOffset, paletteOffset);

    let cFile = `${header}\n${tileData}\n`;
    let hFile = `${header}\n${tileDataH}\n`;

    if (includeMap) {
      const mapData = this.formatMapData(varName, tileMap, tilePaletteArray);
      const mapH = this.formatMapH(varName);
      console.log(mapData);

      cFile += `${mapData}\n`;
      hFile += `${mapH}\n`;
    }
    
    return {
      cFile,
      hFile
    };
  }

  formatHeader(fileName, tileCount, tileDataCount, tileWidth, tileHeight, tileOffset, paletteOffset, includePalette, includeMap, type = 'c') {
    return stripIndents`
      /*
       ${fileName}.${type}

       Info:
        Tile size            : ${tileWidth} x ${tileHeight}
        TileDataCount        : ${tileDataCount}
        TileMapCount         : ${tileCount}
        map size             : ${Math.floor(this.canvas.width / tileWidth)} x ${Math.floor(this.canvas.height / tileHeight)}
        CGB Palette          : 1 Byte per entry.
        tileOffset           : ${tileOffset}
        paletteOffset        : ${paletteOffset}
        Includes palette     : ${!includePalette ? 'false' : 'true'}
        Includes map         : ${!includeMap ? 'false' : 'true'}
      */
    `;
  }

  formatTileData(varName, tileArray) {
    return stripIndents`
      /* Start of tile array. */
      unsigned char ${varName}[${tileArray.length}] = {
        ${this.canvasToFileCore.sliceJoinArr(tileArray, 16, '', ',').replace(/,\s*$/, "")}
      };
    `;
  }

  formatMapData(varName, mapping, tilePaletteArray) {
    return stripIndents`
      ${stripIndents`
      /* CGBpalette entries. */
      unsigned char ${varName}PaletteEntries[${tilePaletteArray.length}] = {
        ${this.canvasToFileCore.sliceJoinArr(tilePaletteArray, 20, '', ',').replace(/,\s*$/, "")}
      };

      /* map array. */
      unsigned char ${varName}Map[${mapping.length}] = {`}\n` +
      this.canvasToFileCore.sliceJoinArr(mapping, 20, '', ',').replace(/,\s*$/, "") +
      '\n};\n';
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
      #define ${varName}TileOffset ${tileOffset}
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
