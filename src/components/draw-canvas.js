const {
  customElements,
  HTMLElementExtended,
  html,
  css
} = require('@webformula/pax-core');

// TODO store canvas state for redraw
// TODO add pixel marker
// TODO add tools: (pencil, brush, blur, spray, erase)
// TODO add cursors based on tools

customElements.define('draw-canvas', class extends HTMLElementExtended {
  constructor() {
    super();

    this.canvasWidth = 160;
    this.canvasHeight = 144;
    this.scale_ = 4;
    this.pixelData = [];

    this.cloneTemplate();
  }

  connectedCallback() {
    const ctx = this.backgroundContext;
    this.bound_mouseDown = this.mouseDown.bind(this);
    this.bound_mouseUp = this.mouseUp.bind(this);
    this.bound_mouseLeave = this.mouseLeave.bind(this);
    this.bound_mouseMove = this.mouseMove.bind(this);
    this.bound_mouseEnter = this.mouseEnter.bind(this);
    this.bound_onContextMenu = this.onContextMenu.bind(this);

    this.addEvents();

    // this.pixelData = [...new Array(this.canvasHeight)].map(i => [...new Array(this.canvasWidth)].map(i => [255, 255, 255, 255]));
    // this.redrawCanvas();

    ctx.fillStyle = 'white';
    ctx.scale(this.scale, this.scale);
    ctx.fillRect(0, 0, this.canvasWidth * this.scale, this.canvasHeight * this.scale);

    this.color = [0,0,0,255];
    this.inited = true;
  }

  addEvents() {
    const canvas_ = this.backgroundCanvas;
    canvas_.addEventListener('mousedown', this.bound_mouseDown);
    canvas_.addEventListener('mouseup', this.bound_mouseUp);
    canvas_.addEventListener('mouseleave', this.bound_mouseLeave);
    canvas_.addEventListener('mousemove', this.bound_mouseMove);
    canvas_.addEventListener('mouseenter', this.bound_mouseEnter);
    canvas_.addEventListener('contextmenu', this.bound_onContextMenu);
  }

  disconnectedCallback() {
    const canvas_ = this.backgroundCanvas;
    canvas_.removeEventListener('mousedown', this.bound_mouseDown);
    canvas_.removeEventListener('mouseup', this.bound_mouseUp);
    canvas_.removeEventListener('mouseleave', this.bound_mouseLeave);
    canvas_.removeEventListener('mousemove', this.bound_mouseMove);
    canvas_.removeEventListener('mouseenter', this.bound_mouseEnter);
    canvas_.removeEventListener('contextmenu', this.bound_onContextMenu);
    this.cursor_ = undefined;
  }

  static get observedAttributes() {
    return ['scale', 'color', 'gridSize'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'scale') this.scale = newValue;
    if (name === 'color') this.color = newValue;
    if (name === 'gridSize') this.gridSize = newValue;
  }

  get color() {
    return this.convertToRGBA(this.color_);
  }

  get rawColor() {
    return this.color_;
  }

  set color(value) {
    if (!value) return;
    this.cursor.style.backgroundColor = this.convertToRGBA(value);
    this.color_ = value;
  }

  get backgroundCanvas() {
    return this.shadowRoot.querySelector('#backround-canvas');
  }

  get backgroundContext() {
    return this.backgroundCanvas.getContext('2d');
  }

  get gridCanvas() {
    return this.shadowRoot.querySelector('#grid-canvas');
  }

  get gridContext() {
    return this.gridCanvas.getContext('2d');
  }

  get tempCanvas() {
    return this.shadowRoot.querySelector('#temp-canvas');
  }

  get tempContext() {
    return this.tempCanvas.getContext('2d');
  }

  get scale() {
    return this.scale_;
  }

  set scale(value) {
    value = parseFloat(value);
    if (value < 1) value = 1;
    this.storeCanvas();
    this.scale_ = value;
    this.cursor.style.width = `${value}px`;
    this.cursor.style.height = `${value}px`;
    if (this.inited) {
      this.disconnectedCallback();
      this.render();
      this.addEvents();
      this.redrawCanvas();
      if (this.showGrid_) this.drawGrid();
    }
  }

  get cursor() {
    if (!this.cursor_) this.cursor_ = this.shadowRoot.querySelector('.cursor');
    return this.cursor_;
  }

  get gridSize() {
    return this.gridSize_ || 8;
  }

  set gridSize(value) {
    this.gridSize_ = parseInt(value);
    if (this.showGrid) this.drawGrid();
  }

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
    this.isMouseDown = false;
    this.cursor.classList.add('hide');
  }

  mouseEnter(e) {
    this.isMouseDown = false;
    this.cursor.classList.remove('hide');
  }

  onContextMenu(e) {
    e.preventDefault();
  }

  mouseMove(e) {
    const bounds = this.getBoundingClientRect();
    if (this.isMouseDown) this.fillPixel(e.clientX, e.clientY);
    let [x, y] = this.snapToPixel(e.clientX - bounds.left, e.clientY - bounds.top);
    this.cursor.style.left = `${x}px`;
    this.cursor.style.top = `${y}px`;
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
    // this.pixelData[y / this.scale][x / this.scale] = this.rawColor;
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

  showGrid() {
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
    const length = width;
    const gridSize = this.gridSize * this.scale;
    let currentColumn = gridSize;
    ctx.canvas.width = ctx.canvas.width;

    while (currentColumn < length) {
      ctx.moveTo(currentColumn, 0);
      ctx.lineTo(currentColumn, height);

      ctx.moveTo(0, currentColumn);
      ctx.lineTo(width, currentColumn);

      currentColumn += gridSize;
    }

    ctx.lineWidth = 0.5;
    ctx.strokeStyle = 'rgba(200,200,200,0.8)';
    ctx.stroke();
  }

  // --- layer management ---
  addLayer() {

  }

  deleteLayer() {

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
        width: 4px;
        height: 4px;
        border: 1px solid #DDD;
      }

      .cursor.hide {
        display: none;
      }

      #grid-canvas {
        position: absolute;
        left: 0.5px;
        top: 0.5px;
        pointer-events: none;
        user-select: none;
      }

      #temp-canvas {
        position: absolute;
      }
    `;
  }

  template() {
    return html`
      <div class="container">
        <div class="cursor"></div>
        <canvas id="backround-canvas" width="${this.canvasWidth * this.scale}" height="${this.canvasHeight * this.scale}"></canvas>
        <canvas id="grid-canvas" width="${this.canvasWidth * this.scale}" height="${this.canvasHeight * this.scale}"></canvas>
      </div>
      <canvas id="temp-canvas" width="0" height="0" style="display: none;"></canvas>
    `;
  }
});
