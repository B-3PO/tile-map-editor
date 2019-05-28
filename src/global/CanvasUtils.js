const ColorUtils = require('./ColorUtils.js');

module.exports = class CanvasUtils {
  constructor(canvas, paletteElement) {
    this.canvas = canvas;
    this.paletteElement = paletteElement;
  }

  get palettes() {
    return this.paletteElement.palettes;
  }

  get palettesInt() {
    return this.paletteElement.palettes.map(p => p.map(ColorUtils.RGBAtoInt));
  }

  forEachTile(fn) {
    this.tilesArray().forEach(fn);
  }

  mapTiles(fn) {
    return this.tilesArray().map(fn);
  }

  tilesArray() {
    const pixelData = this.canvas.getNormalizedCanvasData().data;
    const width = this.canvas.canvasWidth;
    const height = this.canvas.canvasHeight;
    const tileWidth = this.canvas.gridSize.x;
    const tileHeight = this.canvas.gridSize.y;
    const tileRowCount = width / tileWidth;
    const tiles = [];
    let currentRow = 0;
    let pixelCounter = 0;
    let currentColumn;
    let tileIndex;
    let rawColor;

    for (; currentRow < height; currentRow += 1) {
      for (currentColumn = 0; currentColumn < width; currentColumn += 1) {
        tileIndex = Math.floor(currentRow / tileHeight) * tileRowCount + Math.floor(currentColumn / tileWidth);
        rawColor = [pixelData[pixelCounter], pixelData[pixelCounter + 1], pixelData[pixelCounter + 2], pixelData[pixelCounter + 3] / 255];
        if (!tiles[tileIndex]) tiles[tileIndex] = { pixels: [], colors: {} };
        tiles[tileIndex].pixels.push(rawColor);
        tiles[tileIndex].colors[ColorUtils.RGBAtoInt(rawColor)] = rawColor;
        pixelCounter += 4;
      }
    }

    return tiles;
  }
};
