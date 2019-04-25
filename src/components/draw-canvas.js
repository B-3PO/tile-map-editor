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

    this.cloneTemplate();
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
    this.color = [0,0,0,1];
    this.inited = true;
  }

  disconnectedCallback() {
    const canvas_ = this.canvas;
    canvas_.removeEventListener('mousedown', this.bound_mouseDown);
    canvas_.removeEventListener('mouseup', this.bound_mouseUp);
    canvas_.removeEventListener('mouseleave', this.bound_mouseLeave);
    canvas_.removeEventListener('mousemove', this.bound_mouseMove);
  }

  static get observedAttributes() {
    return ['scale', 'color'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'scale') this.scale = newValue;
    if (name === 'color') this.color = newValue;
  }

  get color() {
    return this.color_;
  }

  set color(value) {
    if (!value) return;
    this.cursor.style.backgroundColor = `rgba(${value.join(',')})`;
    this.color_ = `rgba(${value.join(',')})`;
  }

  get canvas() {
    return this.shadowRoot.querySelector('#canvas');
  }

  get context() {
    return this.canvas.getContext('2d');
  }

  get scale() {
    return this.scale_;
  }

  set scale(value) {
    value = parseFloat(value);
    if (value < 1) value = 1;
    this.scale_ = value;
    this.cursor.style.width = `${value}px`;
    this.cursor.style.height = `${value}px`;
    if (this.inited) {
      this.render();
      this.context.scale(value, value);
    }
  }

  get cursor() {
    if (!this.cursor_) this.cursor_ = this.shadowRoot.querySelector('.cursor');
    return this.cursor_;
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
    const bounds = this.getBoundingClientRect();
    if (this.isMouseDown) this.fillPixel(e.clientX, e.clientY);
    let [x, y] = this.snapToPixel(e.clientX - bounds.left, e.clientY - bounds.top);
    this.cursor.style.left = `${x}px`;
    this.cursor.style.top = `${y}px`;
  }

  fillPixel(x, y) {
    const bounds = this.getBoundingClientRect();
    x -= bounds.left;
    y -= bounds.top;
    const [x2, y2] = this.snapToPixel(x, y);
    x = x2;
    y = y2;

    const context_ = this.context;
    context_.fillStyle = this.color;
    context_.fillRect(x / this.scale, y / this.scale, 1, 1);
  }

  snapToPixel(x, y) {
    x -= x % this.scale;
    if (x < 0) x = 0;
    y -= y % this.scale;
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
        width: 4px;
        height: 4px;
        border: 1px solid #DDD;
      }
    `;
  }

  template() {
    return html`
      <div class="container">
        <div class="cursor"></div>
        <canvas id="canvas" width="${this.canvasWidth * this.scale}" height="${this.canvasHeight * this.scale}"></canvas>
      </div>
    `;
  }
});
