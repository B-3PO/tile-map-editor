const {
  customElements,
  HTMLElementExtended,
  html,
  css
} = require('@webformula/pax-core');
const TilePaletteChecker = require('../global/TilePaletteChecker');

// TODO add tools: (pencil, brush, blur, spray, erase)
// TODO add cursors based on tools

customElements.define('draw-canvas', class extends HTMLElementExtended {
  constructor() {
    super();

    this.canvasWidth = this.hasAttribute('width') ? parseInt(this.getAttribute('width')) : 160;
    this.canvasHeight = this.hasAttribute('height') ? parseInt(this.getAttribute('height')) : 144;
    this.scale_ = this.hasAttribute('scale') ? parseInt(this.getAttribute('scale')) : 4;
    this.color_ = [0,0,0,1];

    this.cloneTemplate();
  }

  connectedCallback() {
    this.RGBAtoInt = new TilePaletteChecker().RGBAtoInt;

    const ctx = this.backgroundContext;
    this.bound_mouseDown = this.mouseDown.bind(this);
    this.bound_mouseUp = this.mouseUp.bind(this);
    this.bound_mouseLeave = this.mouseLeave.bind(this);
    this.bound_mouseMove = this.mouseMove.bind(this);
    this.bound_mouseEnter = this.mouseEnter.bind(this);
    this.bound_onContextMenu = this.onContextMenu.bind(this);

    // bind tile validation events
    this.bound_tileValidationMouseEnter = this.tileValidationMouseEnter.bind(this);
    this.bound_tileValidationMouseLeave = this.tileValidationMouseLeave.bind(this);
    this.bound_tileValidationMouseMove = this.tileValidationMouseMove.bind(this);

    this.addBackgroundEvents();

    ctx.fillStyle = 'white';
    ctx.scale(this.scale, this.scale);
    ctx.fillRect(0, 0, this.canvasWidth * this.scale, this.canvasHeight * this.scale);

    this.inited = true;
  }

  disconnectedCallback() {
    this.removeBackgroundEvents();
    this.removeTileValidationEvents();
    this.cursor_ = undefined;
  }

  addBackgroundEvents() {
    const canvas_ = this.backgroundCanvas;
    canvas_.addEventListener('mousedown', this.bound_mouseDown);
    canvas_.addEventListener('mouseup', this.bound_mouseUp);
    canvas_.addEventListener('mouseleave', this.bound_mouseLeave);
    canvas_.addEventListener('mousemove', this.bound_mouseMove);
    canvas_.addEventListener('mouseenter', this.bound_mouseEnter);
    canvas_.addEventListener('contextmenu', this.bound_onContextMenu);
  }

  removeBackgroundEvents() {
    const canvas_ = this.backgroundCanvas;
    canvas_.removeEventListener('mousedown', this.bound_mouseDown);
    canvas_.removeEventListener('mouseup', this.bound_mouseUp);
    canvas_.removeEventListener('mouseleave', this.bound_mouseLeave);
    canvas_.removeEventListener('mousemove', this.bound_mouseMove);
    canvas_.removeEventListener('mouseenter', this.bound_mouseEnter);
    canvas_.removeEventListener('contextmenu', this.bound_onContextMenu);
  }

  static get observedAttributes() {
    return ['width', 'height', 'scale', 'color', 'gridSize'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.inited) return;
    if (name === 'scale') this.scale = newValue;
    if (name === 'color') this.color = newValue;
    if (name === 'gridSize') this.gridSize = newValue;
    if (name === 'width') this.width = newValue;
    if (name === 'height') this.height = newValue;
  }

  get color() {
    return this.convertToRGBA(this.color_);
  }

  get rawColor() {
    return this.color_;
  }

  set color(value) {
    if (!value) return;
    this.color_ = value;
    this.drawMainCursor();
  }

  get backgroundCanvas() {
    return this.shadowRoot.querySelector('#backround-canvas');
  }

  get backgroundContext() {
    return this.backgroundCanvas.getContext('2d');
  }

  get gridContext() {
    return this.shadowRoot.querySelector('#grid-canvas').getContext('2d');
  }

  get tileValidationContext() {
    return this.shadowRoot.querySelector('#tile-validation-canvas').getContext('2d');
  }

  get tempCanvas() {
    return this.shadowRoot.querySelector('#temp-canvas');
  }

  get tempContext() {
    return this.tempCanvas.getContext('2d');
  }

  get tempCanvas2() {
    return this.shadowRoot.querySelector('#temp-canvas-2');
  }

  get tempContext2() {
    return this.tempCanvas2.getContext('2d');
  }

  get width() {
    return this.canvasWidth;
  }

  set width(value) {
    this.canvasWidth = parseInt(value);
    this.storeCanvas();
    // disconnect listenres, we are going to redraw the screen and the elements will change
    this.disconnectedCallback();
    // redraw elements
    this.render();
    // add back evnets
    if (!this.showTileValidation_) this.addBackgroundEvents();
    else this.addTileValidationEvents();
    // redraw canvas
    this.redrawCanvas();
    // optional draw grid
    if (this.showGrid_) this.drawGrid();
    if (this.showTileValidation_) this.showTileValidation();
  }

  get height() {
    return this.canvasHeight;
  }

  set height(value) {
    this.canvasHeight = parseInt(value);
    this.storeCanvas();
    // disconnect listenres, we are going to redraw the screen and the elements will change
    this.disconnectedCallback();
    // redraw elements
    this.render();
    // add back evnets
    if (!this.showTileValidation_) this.addBackgroundEvents();
    else this.addTileValidationEvents();
    // redraw canvas
    this.redrawCanvas();
    // optional draw grid
    if (this.showGrid_) this.drawGrid();
    if (this.showTileValidation_) this.showTileValidation();
  }

  get scale() {
    return this.scale_;
  }

  set scale(value) {
    value = parseFloat(value);
    if (value < 1) value = 1;
    // store canvas before scale change
    this.storeCanvas();

    // update scale
    this.scale_ = value;

    if (this.inited) {
      // disconnect listenres, we are going to redraw the screen and the elements will change
      this.disconnectedCallback();
      // redraw elements
      this.render();
      // add back evnets
      if (!this.showTileValidation_) this.addBackgroundEvents();
      else this.addTileValidationEvents();
      // redraw canvas
      this.redrawCanvas();
      // optional draw grid
      if (this.showGrid_) this.drawGrid();
      if (this.showTileValidation_) this.showTileValidation();
    }

    this.drawMainCursor();
  }

  get cursor() {
    if (!this.cursor_) this.cursor_ = this.shadowRoot.querySelector('.cursor');
    return this.cursor_;
  }

  get gridSize() {
    return this.gridSize_ || {x: 8, y: 8};
  }

  set gridSize({x, y}) {
    this.gridSize_ = {x, y};
    if (this.showGrid_) this.drawGrid();
  }

  get tileWidth() {
    return this.tileWidth_;
  }

  set tileWidth(value) {
    this.tileWidth_ = parseInt(value);
  }

  get tileHeight() {
    return this.tileHeight_;
  }

  set tileHeight(value) {
    this.tileHeight_ = parseInt(value);
  }

  // --- bockground canvas events ---
  mouseDown(e) {
    // block right click
    if (e.which !== 1) return;

    this.isMouseDown = true;
    this.fillPixel(e.clientX, e.clientY);
  }

  mouseUp(e) {
    // block right click
    if (e.which !== 1) return;

    this.isMouseDown = false;
  }

  mouseLeave(e) {
    this.clearCursor();
    this.isMouseDown = false;
  }

  mouseEnter(e) {
    this.drawMainCursor();
    this.isMouseDown = false;
  }

  onContextMenu(e) {
    e.preventDefault();
  }

  mouseMove(e) {
    const bounds = this.getBoundingClientRect();
    if (this.isMouseDown) this.fillPixel(e.clientX, e.clientY);
    let [x, y] = this.snapToPixel(e.clientX - bounds.left, e.clientY - bounds.top);
    this.moveCursor(x, y);
  }



  // --- cursors ---

  moveCursor(x, y) {
    this.cursor.style.left = `${x}px`;
    this.cursor.style.top = `${y}px`;
  }

  drawMainCursor() {
    this.cursor.style.width = `${this.scale}px`;
    this.cursor.style.height = `${this.scale}px`;
    this.cursor.style.backgroundColor = this.color;
    this.cursor.style.border = '1px solid #DDD';
  }

  drawTileValidationCursor() {
    this.cursor.style.width = `${this.tileWidth * this.scale}px`;
    this.cursor.style.height = `${this.tileWidth * this.scale}px`;
    this.cursor.style.backgroundColor = 'rgba(255, 50, 50, 0.1)';
    this.cursor.style.border = 'none';
  }

  clearCursor() {
    this.cursor.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    this.cursor.style.border = 'none';
  }



  drawImage(image, x, y) {
    this.backgroundContext.imageSmoothingEnabled = false;
    this.backgroundContext.drawImage(image, x, y);
    this.storeCanvas();
  }

  fillPixel(x, y) {
    const bounds = this.getBoundingClientRect();
    x -= bounds.left;
    y -= bounds.top;
    const [x2, y2] = this.snapToPixel(x, y);
    x = x2;
    y = y2;

    const ctx = this.backgroundContext;
    ctx.fillStyle = this.color;
    ctx.fillRect(x / this.scale, y / this.scale, 1, 1);
  }

  snapToPixel(x, y) {
    x -= x % this.scale;
    if (x < 0) x = 0;
    y -= y % this.scale;
    if (y < 0) y = 0;
    return [x, y];
  }

  convertToRGBA(value) {
    return `rgba(${value.join(',')})`;
  }

  getPixelCount() {
    return this.canvasWidth * this.canvasHeight;
  }

  redrawCanvas() {
    // copy to identical canvis of ientical size
    const tempCanvas = this.tempCanvas;
    tempCanvas.width = this.canvasData.width;
    tempCanvas.height = this.canvasData.height;
    this.tempContext.putImageData(this.canvasData, 0, 0);

    // use draw image, this has an option for streatching
    const ctx = this.backgroundContext;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tempCanvas, 0, 0, this.canvasData.width, this.canvasData.height, 0, 0, this.canvasWidth * this.scale, this.canvasHeight * this.scale);
    ctx.scale(this.scale, this.scale);
  }

  storeCanvas() {
    this.canvasData = this.backgroundContext.getImageData(0, 0, this.canvasWidth * this.scale, this.canvasHeight * this.scale);
  }

  getNormalizedCanvasData() {
    this.storeCanvas();

    // copy to identical canvis of ientical size
    const tempCanvas = this.tempCanvas;
    tempCanvas.width = this.canvasData.width;
    tempCanvas.height = this.canvasData.height;
    this.tempContext.putImageData(this.canvasData, 0, 0);

    // use draw image, this has an option for streatching
    const tempCanvas2 = this.tempCanvas2;
    tempCanvas2.width = this.canvasWidth;
    tempCanvas2.height = this.canvasHeight;
    const ctx = this.tempContext2;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tempCanvas, 0, 0, this.canvasData.width, this.canvasData.height, 0, 0, this.canvasWidth, this.canvasHeight);

    return ctx.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
  }

  showGrid() {;
    this.showGrid_ = true;
    this.drawGrid();
  }

  hideGrid() {
    this.showGrid_ = false;
    this.gridContext.canvas.width = this.gridContext.canvas.width;
  }

  drawGrid() {
    const ctx = this.gridContext;
    const width = this.canvasWidth * this.scale;
    const height = this.canvasHeight * this.scale;
    const gridSizeX = this.gridSize.x * this.scale;
    const gridSizeY = this.gridSize.y * this.scale;
    let currentColumn = gridSizeX;
    let currentRow = gridSizeY;
    ctx.canvas.width = ctx.canvas.width;

    while (currentColumn < width) {
      ctx.moveTo(currentColumn, 0);
      ctx.lineTo(currentColumn, height);
      currentColumn += gridSizeX;
    }

    while (currentRow < height) {
      ctx.moveTo(0, currentRow);
      ctx.lineTo(width, currentRow);
      currentRow += gridSizeY;
    }

    ctx.lineWidth = 0.5;
    ctx.strokeStyle = 'rgba(200,200,200,0.8)';
    ctx.stroke();
  }

  getTileData() {
    const pData = this.getNormalizedCanvasData().data;
    const width = this.canvasWidth;
    const height = this.canvasHeight;
    const tileWidth = this.gridSize.x;
    const tileHeight = this.gridSize.y;
    const tileRowCount = width / tileWidth;
    const tiles = [...new Array((width / tileWidth) * (height / tileHeight))].map(() => ({}));
    let currentRow = 0;
    let currentColumn = 0;
    let pixelCounter = 0;

    let tile = 0;
    let tilePixel;

    for (; currentRow < height; currentRow += 1) {
      for (; currentColumn < width; currentColumn += 1) {
        tile = Math.floor(currentRow / tileHeight) * tileRowCount + Math.floor(currentColumn / tileWidth);
        tiles[tile][this.RGBAtoInt([ pData[pixelCounter], pData[pixelCounter+1], pData[pixelCounter+2], pData[pixelCounter+3] / 255 ])] = true;
        pixelCounter += 4;
      }
      currentColumn = 0;
    }

    return tiles;
  }



  // --- tile validation ---

  get tileValidation() {
    return this.tileValidation_;
  }

  set tileValidation(value) {
    this.tileValidation_ = value;
    if (value && this.showTileValidation_ === true) this.showTileValidation();
  }

  showTileValidation() {
    if (this.tileValidation) {
      this.showTileValidation_ = true;
      this.drawTileValidation();
      this.removeBackgroundEvents();
      this.addTileValidationEvents();
      this.shadowRoot.querySelector('#tile-validation-canvas').style.pointerEvents = '';
    } else {
      console.warn('cannot show validation because "tileValidation" data was not set');
    }
  }

  hideTileValidation() {
    this.showTileValidation_ = false;
    const ctx = this.tileValidationContext;
    ctx.canvas.width = ctx.canvas.width;
    this.shadowRoot.querySelector('#tile-validation-canvas').style.pointerEvents = 'none';
    this.drawMainCursor();
    this.addBackgroundEvents();
  }

  drawTileValidation() {
    const tileWidth = this.tileWidth * this.scale;
    const tileHeight = this.tileHeight * this.scale;
    const tileRowCount = this.canvasWidth / this.tileWidth;
    const ctx = this.tileValidationContext;
    ctx.canvas.width = ctx.canvas.width;

    ctx.lineWidth = 0.5;
    ctx.strokeStyle = 'rgba(238,51,51,0.8)';
    this.tileValidation.tiles.forEach(t => {
      if (!t.valid) {
        const y = Math.floor(t.tileId / tileRowCount) * tileHeight;
        const x = (t.tileId % tileRowCount) * tileWidth;
        ctx.strokeRect(x, y, tileWidth, tileHeight);
      }
    });
  }

  addTileValidationEvents() {
    const canvas_ = this.shadowRoot.querySelector('#tile-validation-canvas');
    canvas_.addEventListener('mouseleave', this.bound_tileValidationMouseLeave);
    canvas_.addEventListener('mousemove', this.bound_tileValidationMouseMove);
    canvas_.addEventListener('mouseenter', this.bound_tileValidationMouseEnter);
  }

  removeTileValidationEvents() {
    const canvas_ = this.shadowRoot.querySelector('#tile-validation-canvas');
    canvas_.removeEventListener('mouseleave', this.bound_tileValidationMouseLeave);
    canvas_.removeEventListener('mousemove', this.bound_tileValidationMouseMove);
    canvas_.removeEventListener('mouseenter', this.bound_tileValidationMouseEnter);
  }

  tileValidationMouseEnter(e) {
    this.drawTileValidationCursor();
    this.isOnTileValidationCanvas = true;
  }

  tileValidationMouseLeave(e) {
    this.clearCursor();
    this.isOnTileValidationCanvas = false;
  }

  tileValidationMouseMove(e) {
    const bounds = this.getBoundingClientRect();
    const [x, y] = this.snapToTile(e.clientX - bounds.left, e.clientY - bounds.top);
    this.moveCursor(x, y);
  }

  snapToTile(x, y) {
    x -= x % (this.tileWidth * this.scale);
    if (x < 0) x = 0;
    y -= y % (this.tileHeight * this.scale);
    if (y < 0) y = 0;
    return [x, y];
  }


  styles() {
    return css`
      :host {
        display: block;
        cursor: none;
      }

      .container {
        position: relative;
        cursor: none;
      }

      .cursor {
        position: absolute;
        z-index: 10;
        cursor: none;
        user-select: none;
        pointer-events: none;
        border: 1px solid #DDD;
        width: 4px;
        height: 4px;
      }

      .cursor.hide {
        display: none;
      }

      #tile-validation-canvas {
        position: absolute;
        left: 0px;
        top: 0px;
        user-select: none;
      }

      #grid-canvas {
        position: absolute;
        left: 0.5px;
        top: 0.5px;
        pointer-events: none;
        user-select: none;
      }

      #temp-canvas,
      #temp-canvas-2 {
        position: absolute;
        display: none;
      }
    `;
  }

  template() {
    return html`
      <div class="container">
        <div class="cursor"></div>
        <canvas id="backround-canvas" width="${this.canvasWidth * this.scale}" height="${this.canvasHeight * this.scale}"></canvas>
        <canvas id="grid-canvas" width="${this.canvasWidth * this.scale}" height="${this.canvasHeight * this.scale}"></canvas>
        <canvas id="tile-validation-canvas" width="${this.canvasWidth * this.scale}" height="${this.canvasHeight * this.scale}" style="${this.showTileValidation_ ? '' : 'pointer-events: none;'}"></canvas>
      </div>
      <canvas id="temp-canvas" width="0" height="0"></canvas>
      <canvas id="temp-canvas-2" width="0" height="0"></canvas>
    `;
  }
});
