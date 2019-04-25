const { Page, html } = require('@webformula/pax-core');

module.exports = class Home extends Page {
  constructor() {
    super();
    this.canvasX = 0;
    this.canvasY = 0;
    this.canvasWidth = 160;
    this.canvasHeight = 144;
    this.scale = 4;
  }

  connectedCallback() {
    this.bound_paletteChange = this.paletteChange.bind(this);
    this.paletteTool.addEventListener('change', this.bound_paletteChange);

    this.centerCanvas();

    this.canvas.color = this.paletteTool.selectedColor;
  }

  disconnectedCallback() {
    this.paletteTool.removeEventListener('change', this.bound_paletteChange);
  }

  get title() {
    return 'Home';
  }

  get paletteTool() {
    return document.querySelector('palette-tool');
  }

  paletteChange(e) {
    this.canvas.color = e.detail.selectedColor;
  }

  get canvasContainer() {
    return document.querySelector('.canvas-container');
  }

  get canvasPlane() {
    return document.querySelector('.canvas-plane');
  }

  get canvas() {
    return document.querySelector('draw-canvas');
  }

  centerCanvas() {
    const containerBounds = this.canvasContainer.getBoundingClientRect();
    const canvasBounds = this.canvas.getBoundingClientRect();
    this.canvasPlane.style.left = `${(containerBounds.width / 2) - (canvasBounds.width / 2)}px`;
    this.canvasPlane.style.top = `${(containerBounds.height / 2) - (canvasBounds.height / 2)}px`;
  }

  scaleCanvas(scale) {
    this.canvas.scale = scale;
    this.centerCanvas();
  }

  updateGrid(show, pixels) {
    if (show) {
      this.canvas.gridSize = pixels;
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
      <div class="main-container">
        <div class="tool-bar">
          <div class="icon-button">edit</div>
          <div class="icon-button">brush</div>
          <div class="icon-button">colorize</div>
          <div style="flex: 1;"></div>
          <label for="fileChooser" class="icon-button">image</label>
          <input hidden="true" type="file" name="fileChooser" id="fileChooser" accept="image/jpeg,image/png" onchange="$Home.loadImage(this)">
          <div class="icon-button">save</div>
        </div>
        <div class="canvas-container">
          <div class="canvas-plane">
            <!-- TODO replace with component -->
            <draw-canvas scale="4"></draw-canvas>
          </div>
          <div class="scale-container">
            <scale-range min="1" max="10" value="4" onchange="$Home.scaleCanvas(this.value)"></scale-range>
            <grid-settings onchange="$Home.updateGrid(this.show, this.pixels)"></grid-settings>
          </div>
        </div>
        <div class="settings-container">
          <palette-tool count="4" color-count="4"></palette-tool>
        </div>
      </div>
    `;
  }
};
