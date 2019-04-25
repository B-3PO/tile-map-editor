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
    const canvas_ = this.canvas;
    const context_ = this.context;
    this.bound_mouseDown = this.mouseDown.bind(this);
    this.bound_mouseUp = this.mouseUp.bind(this);
    this.bound_mouseLeave = this.mouseLeave.bind(this);
    this.bound_mouseMove = this.mouseMove.bind(this);

    canvas_.addEventListener('mousedown', this.bound_mouseDown);
    canvas_.addEventListener('mouseup', this.bound_mouseUp);
    canvas_.addEventListener('mouseleave', this.bound_mouseLeave);
    canvas_.addEventListener('mousemove', this.bound_mouseMove);

    context_.fillStyle = 'white';
    context_.scale(this.scale, this.scale);
    context_.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  disconnectedCallback() {
    const canvas_ = this.canvas;
    canvas_.removeEventListener('mousedown', this.bound_mouseDown);
    canvas_.removeEventListener('mouseup', this.bound_mouseUp);
    canvas_.removeEventListener('mouseleave', this.bound_mouseLeave);
    canvas_.removeEventListener('mousemove', this.bound_mouseMove);
  }

  get title() {
    return 'Home';
  }

  get canvas() {
    return document.querySelector('#canvas');
  }

  get context() {
    return this.canvas.getContext('2d');
  }

  mouseDown(e) {
    this.isMouseDown = true;
    this.fillPixel(e.clientX, e.clientY);
  }

  mouseUp(e) {
    this.isMouseDown = false;
  }

  mouseLeave(e) {
    this.isMouseDown = false;
  }

  mouseMove(e) {
    if (this.isMouseDown) {
      this.fillPixel(e.clientX, e.clientY);
    }

    // TODO add pixel icon display
  }

  fillPixel(x, y, color = '#000000') {
    // TODO add pixel snapping for scale
    const context_ = this.context;
    context_.fillStyle = color;
    context_.fillRect((x / (this.scale * this.scale)) - this.canvasX, (y / (this.scale * this.scale)) - this.canvasY, 1, 1);
  }

  template() {
    return html`
      <canvas id="canvas" width="${this.canvasWidth * this.scale}" height="${this.canvasHeight * this.scale}"></canvas>
      <palette-tool count="4" color-count="4"></palette-tool>
    `;
  }
};
