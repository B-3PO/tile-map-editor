module.exports = class TilePaletteChecker {
  constructor(canvas, palette) {
    this.canvas = canvas;
    this.paletteTool = palette;
  }

  get tileSize() {
    return this.canvas.gridSize;
  }

  get canvasSize() {
    return {
      width: this.canvas.width,
      height: this.canvas.height
    }
  }

  get palettes() {
    return this.paletteTool.palettes.map(p => this.convertRGBAArrToInt(p));
  }

  check() {
    const { tileColors, rawTileData } = this.canvas.getTileData();
    const palettes = this.palettes;
    const paletteColorLength = palettes[0].length;
    const invalidTiles = [];

    const tileValidationData = tileColors.map((t, i) => {
      const tileColors = Object.keys(t).map(parseInt);
      const colorCount = tileColors.length;
      const paletteMatch = this.matchPalette(palettes, tileColors);
      let valid = true;
      let reason;

      if (colorCount > paletteColorLength) {
        valid = false;
        reason = `More than ${paletteColorLength} colors. Found ${colorCount} in tile`;
      }
      if (paletteMatch === undefined) {
        valid = false;
        reason = 'no palette match';
      }
      if (!valid) invalidTiles.push(i);

      return {
        valid,
        tileId: i,
        reason,
        palette: paletteMatch,
        colors: tileColors
      };
    });

    return {
      rawTileData,
      tileValidationData,
      invalidTiles,
      valid: invalidTiles.length > 0
    };
  }

  matchPalette(palettes, tileColors) {
    let tileColorLength = tileColors.length;
    let palleteLength = palettes.length;
    let i = 0;
    let j;
    let match = true;

    for (; i < palleteLength; i += 1) {
      for (j = 0; j < tileColorLength; j += 1) {
        if (!palettes[i].includes(tileColors[j])) match = false;
      }

      if (match === true) return i;
    }

    return undefined;
  }

  convertRGBAArrToInt(arr) {
    return arr.map(this.RGBAtoInt);
  }

  RGBAtoInt(arr) {
    return ((Math.round(arr[3] * 255) << 24) >>> 0 | arr[0] << 16 | arr[1] << 8 | arr[2]) >>> 0;
  }

  intToRGBA(num) {
    return `rgba(${num >> 24 & 255},${num >> 16 & 255},${num >> 8  & 255},${(num & 255) / 255})`;
  }
};
