const CanvasUtils = require('./CanvasUtils.js');
const ColorUtils = require('./ColorUtils.js');

module.exports = class TilePaletteChecker {
  constructor(canvas, palette) {
    this.canvasUtils = new CanvasUtils(canvas, palette);
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
    const p = Object.keys(Object.keys(colorObj)
      .map(cInt => this.findColorInPalettes(palettes, parseInt(cInt)))
      .reduce((a, palette) => {
        a[palette] = true;
        return a;
      }, {}));
    return (p.length === 1 && p[0] !== '-1') ? p[0] : undefined;
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
