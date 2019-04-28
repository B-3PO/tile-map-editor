const { Page, html } = require('@webformula/pax-core');
const TilePaletteChecker = require('../global/TilePaletteChecker');

module.exports = class Home extends Page {
  constructor() {
    super();

    this.canvasWidth = 160;
    this.canvasHeight = 144;
    this.scale = 4;
    this.diableEntry = true;
  }

  connectedCallback() {
    this.bound_paletteChange = this.paletteChange.bind(this);
    this.paletteTool.addEventListener('change', this.bound_paletteChange);
    this.centerCanvas();
    this.canvas.color = this.paletteTool.selectedColor;
    this.canvas.tileWidth = 8;
    this.canvas.tileHeight = 8;
    this.bound_onCreate = this.onCreate.bind(this);
    if (!this.diableEntry) this.entryDialog.addEventListener('create', this.bound_onCreate);

    this.tilePaletteValidator.canvas = this.canvas;
    this.tilePaletteValidator.paletteTool = this.paletteTool;
  }

  disconnectedCallback() {
    this.paletteTool.removeEventListener('change', this.bound_paletteChange);
    if (!this.diableEntry) this.entryDialog.removeEventListener('create', this.bound_onCreate);
  }

  get title() {
    return 'Home';
  }

  get paletteTool() {
    return document.querySelector('palette-tool');
  }

  get canvas() {
    return document.querySelector('draw-canvas');
  }

  get entryDialog() {
    return document.querySelector('entry-dialog');
  }

  get tilePaletteValidator() {
    return document.querySelector('tile-palette-validator');
  }

  paletteChange(e) {
    this.canvas.color = e.detail.selectedColor;
  }

  onCreate(e) {
    this.entryDialog.removeEventListener('create', this.bound_onCreate);

    // set tile size and update the grid overlay settings
    const gridSettings = document.querySelector('grid-settings');
    gridSettings.valueX = e.detail.tile.x;
    gridSettings.valueY = e.detail.tile.y;
    this.canvas.tileWidth = e.detail.tile.x;
    this.canvas.tileHeight = e.detail.tile.y;

    // set canvas size
    // TODO implament cancas size
    this.canvasWidth = e.detail.size.x;
    this.canvasHeight = e.detail.size.y;
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
    this.centerCanvas();

    // set palette
    this.paletteTool.colorCount = e.detail.palette.colorCount;
    this.paletteTool.count = e.detail.palette.count;
  }

  centerCanvas() {
    const canvasPlane = document.querySelector('.canvas-plane');
    const containerBounds = document.querySelector('.canvas-container').getBoundingClientRect();
    const canvasBounds = this.canvas.getBoundingClientRect();
    canvasPlane.style.left = `${(containerBounds.width / 2) - (canvasBounds.width / 2)}px`;
    canvasPlane.style.top = `${(containerBounds.height / 2) - (canvasBounds.height / 2)}px`;
  }

  scaleCanvas(scale) {
    this.canvas.scale = scale;
    this.centerCanvas();
  }

  updateGrid(show, x, y) {
    if (show) {
      this.canvas.gridSize = {x, y};
      this.canvas.showGrid();
    } else this.canvas.hideGrid();
  }

  loadImage(el) {
    if(el.files.length === 0) return;
    const file = el.files[0];
    if(file.type !== '' && !file.type.match('image.*')) return;

    const image = new Image();
    image.addEventListener('load', () => {
      this.canvas.drawImage(image, 0, 0);
    }, false);
    image.src = window.URL.createObjectURL(file);
  }

  template() {
    return html`
      ${!this.diableEntry ? '<entry-dialog></entry-dialog>' : ''}

      <div class="main-container">
        <div class="tool-bar">
          <div class="icon-button">edit</div>
          <div class="icon-button-svg">
            <img src="eyedropper.svg" alt="color-picker">
          </div>
          <div class="icon-button-svg">
            <img src="format-color-fill.svg" alt="color-fill">
          </div>
          <div style="flex: 1;"></div>
          <label for="fileChooser" class="icon-button-svg">
            <img src="file-upload.svg" alt="image-upload">
          </label>
          <input hidden="true" type="file" name="fileChooser" id="fileChooser" accept="image/jpeg,image/png" onchange="$Home.loadImage(this)">
          <div class="icon-button">save</div>
        </div>
        <div class="canvas-container">
          <div class="canvas-plane">
            <!-- TODO replace with component -->
            <draw-canvas width="${this.canvasWidth}" height="${this.canvasHeight}" scale="4"></draw-canvas>
          </div>
          <div class="scale-container">
            <tile-palette-validator></tile-palette-validator>
            <scale-range min="1" max="10" value="4" onchange="$Home.scaleCanvas(this.value)"></scale-range>
            <grid-settings onchange="$Home.updateGrid(this.show, this.valueX, this.valueY)"></grid-settings>
          </div>
        </div>
        <div class="settings-container">
          <palette-tool count="4" color-count="4"></palette-tool>
        </div>
      </div>
    `;
  }
};
