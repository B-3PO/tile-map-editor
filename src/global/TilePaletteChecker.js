const CanvasUtils = require('./CanvasUtils.js');
const ColorUtils = require('./ColorUtils.js');

module.exports = class TilePaletteChecker {
  constructor() {
    this.canvasUtils = new CanvasUtils();
  }

  check() {
    const palettesInt = this.canvasUtils.palettesInt;
    const tileData = this.canvasUtils.mapTiles((tile, i) => {
      const palette = this.findPalette(palettesInt, tile.colors);
      return {
        id: i,
        valid: palette !== undefined,
        pixels: tile.pixels,
        colors: Object.keys(tile.colors).map(k => k),
        palette
      };
    });
    const invalidTiles = tileData.filter(o => !o.valid);

    return {
      tileData,
      invalidTiles,
      valid: invalidTiles.length === 0
    };
  }

  findPalette(palettes, colorObj) {
    const palLen = palettes.length;
    const colors = Object.keys(colorObj).map(i => parseInt(i));
    let i = 0;
    for(; i < palLen; i += 1) {
      if (colors.filter(cInt => !palettes[i].includes(cInt)).length === 0) {
        return i;
      }
    }
  }

  findColorInPalettes(palettes, cInt) {
    const length = palettes.length;
    let i = 0;

    for(; i < length; i += 1) {
      if (palettes[i].includes(cInt)) {
        return i;
      }
    }

    return -1;
  }
};
