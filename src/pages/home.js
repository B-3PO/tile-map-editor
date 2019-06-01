const { Page, html } = require('@webformula/pax-core');
const TilePaletteChecker = require('../global/TilePaletteChecker');
const ColorUtils = require('../global/ColorUtils');

module.exports = class Home extends Page {
  constructor() {
    super();

    this.canvasWidth = 160;
    this.canvasHeight = 144;
    this.scale = 4;
    this.disableEntry = false;
    this.canvasPlaneX = 0;
    this.canvasPlaneY = 0;
    this.bound_extractButtonClick = this.extractButtonClick.bind(this);
  }

  connectedCallback() {
    this.bound_paletteChange = this.paletteChange.bind(this);
    this.paletteTool.addEventListener('change', this.bound_paletteChange);
    this.centerCanvas();
    this.canvas.color = this.paletteTool.rawColor;
    this.canvas.altColor = this.paletteTool.rawAltColor;
    this.canvas.tileWidth = 8;
    this.canvas.tileHeight = 8;
    this.bound_onCreate = this.onCreate.bind(this);
    this.bound_onColorPick = this.onColorPick.bind(this);
    if (!this.disableEntry) this.entryDialog.addEventListener('create', this.bound_onCreate);

    this.canvas.addEventListener('colorPicked', this.bound_onColorPick);

    this.tilePaletteValidator.canvas = this.canvas;
    this.tilePaletteValidator.paletteTool = this.paletteTool;

    this.bound_onKeyPress = this.onKeyPress.bind(this);
    this.bound_onKeyRelease = this.onKeyRelease.bind(this);
    this.bound_onMouseMove = this.onMouseMove.bind(this);
    document.addEventListener('keydown', this.bound_onKeyPress);
    document.addEventListener('keyup', this.bound_onKeyRelease);
    document.addEventListener('mousemove', this.bound_onMouseMove);
    document.querySelector('#mapper-button').addEventListener('click', this.bound_extractButtonClick);
  }

  disconnectedCallback() {
    this.paletteTool.removeEventListener('change', this.bound_paletteChange);
    if (!this.disableEntry) this.entryDialog.removeEventListener('create', this.bound_onCreate);
    this.canvas.removeEventListener('colorPicked', this.bound_onColorPick);
    document.removeEventListener('keydown', this.bound_onKeyPress);
    document.removeEventListener('keyup', this.bound_onKeyRelease);
    document.removeEventListener('mousemove', this.bound_onMouseMove);
    document.querySelector('#mapper-button').removeEventListener('click', this.bound_extractButtonClick);
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
    this.canvas.altColor = e.detail.altColor;
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

    // this.paletteTool.setPalette(0, [
    //   [198, 209, 211, 1],
    //   [81, 125, 136, 1],
    //   [139, 133, 109, 1],
    //   [0, 0, 0, 1]
    // ]);
    //
    // this.paletteTool.setPalette(1, [
    //   [139, 133, 109, 1],
    //   [34, 34, 34, 1],
    //   [11, 13, 13, 1],
    //   [0, 0, 0, 1]
    // ]);

    // this.paletteTool.setPalette(0, [
    //   [208, 32, 127, 1],
    //   [153, 23, 93, 1],
    //   [97, 15, 59, 1],
    //   [0, 0, 0, 1]
    // ]);
  }

  centerCanvas() {
    const canvasPlane = document.querySelector('.canvas-plane');
    const containerBounds = document.querySelector('.canvas-container').getBoundingClientRect();
    const canvasBounds = this.canvas.getBoundingClientRect();
    this.canvasPlaneX = (containerBounds.width / 2) - (canvasBounds.width / 2);
    this.canvasPlaneY = (containerBounds.height / 2) - (canvasBounds.height / 2);
    canvasPlane.style.left = `${this.canvasPlaneX}px`;
    canvasPlane.style.top = `${this.canvasPlaneY}px`;
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

  showSaveDialog() {
    document.querySelector('.main-container').insertAdjacentHTML('beforebegin', '<save-dialog></save-dialog>');
    const el = document.querySelector('save-dialog');
    el.canvas = this.canvas;
    el.paletteTool = this.paletteTool;
  }

  showUploadDialog() {
    document.querySelector('.main-container').insertAdjacentHTML('beforebegin', '<upload-dialog></upload-dialog>');
    const el = document.querySelector('upload-dialog');
    el.canvas = this.canvas;
  }

  pencilTool() {
    this.canvas.pencil();
  }

  colorPickerTool() {
    this.canvas.colorPicker();
  }

  brushTool() {
    this.canvas.brush();
  }

  onColorPick(e) {
    this.paletteTool.color = e.detail.color;
  }

  onKeyPress(e) {
    switch (e.keyCode) {
      case 32:
        this.spacePressed = true;
        break;
    }
  }

  onKeyRelease(e) {
    switch (e.keyCode) {
      case 32:
        this.spacePressed = false;
        break;
    }
  }

  onMouseMove(e) {
    if (this.spacePressed) {
      const canvasPlane = document.querySelector('.canvas-plane');
      this.canvasPlaneX += e.movementX;
      this.canvasPlaneY += e.movementY;
      canvasPlane.style.left = `${this.canvasPlaneX}px`;
      canvasPlane.style.top = `${this.canvasPlaneY}px`;
    }
  }

  extractButtonClick(e) {
    document.body.insertAdjacentHTML('beforeend', '<palette-mapper></palette-mapper>');
    const el = document.querySelector('palette-mapper');
    el.addEventListener('change', (e) => {
      e.detail.colorMap.forEach((p, i) => {
        this.paletteTool.setPalette(i, Object.keys(p).map(ColorUtils.RGBToArray));
      })
      this.canvas.remapColors(e.detail.colorMap);
    });
  }

  template() {
    return html`
      ${!this.disableEntry ? '<entry-dialog></entry-dialog>' : ''}

      <div class="main-container">
        <div class="tool-bar">
          <div class="icon-button" onclick="$Home.pencilTool();">edit</div>
          <div class="icon-button" onclick="$Home.brushTool();">brush</div>
          <div class="icon-button-svg" onclick="$Home.colorPickerTool();">
            <img src="eyedropper.svg" alt="color-picker">
          </div>
          <div class="icon-button-svg">
            <img src="format-color-fill.svg" alt="color-fill">
          </div>
          <div style="flex: 1;"></div>
          <div class="icon-button-svg" onclick="$Home.showUploadDialog()">
            <img src="file-upload.svg" alt="image-upload">
          </div>
          <div class="icon-button" onclick="$Home.showSaveDialog()">save</div>
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

          <div class="divider"></div>

          <div style="padding: 10px;">
            <button id="mapper-button">Convert cavas colors to Palette</button>
          </div>

          <div class="divider"></div>

          <settings-tool></settings-tool>
        </div>
      </div>
    `;
  }
};
