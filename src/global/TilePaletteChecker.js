module.exports = class TilePaletteChecker {
  constructor(canvas, palette) {
    this.canvas = canvas;
    this.palette = palette;
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
    return this.palette.palettes;
  }

  check() {
    console.log(this.canvas.getTileData());
  }
};
