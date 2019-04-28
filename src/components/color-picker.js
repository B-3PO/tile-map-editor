const {
  customElements,
  HTMLElementExtended,
  html,
  css
} = require('@webformula/pax-core');

customElements.define('color-picker', class extends HTMLElementExtended {
  constructor() {
    super();

    this.pickerX = 150;
    this.pickerY = 0;
    this.colorBlockSize = 150;
    this.colorStripWidth = 30;
    this.rgbaColor = 'rgba(255,0,0,1)';
    this.pickerColor = this.rgbaColor;

    this.cloneTemplate();
  }

  connectedCallback() {
    this.colorBlockContext.rect(0, 0, this.colorBlockSizeh1, this.colorBlockSize);
    this.fillGradient();

    const ctx2 = this.colorStripContext;
    ctx2.rect(0, 0, this.colorStripWidth, this.colorBlockSize);
    const grd1 = ctx2.createLinearGradient(0, 0, 0, this.colorBlockSize);
    grd1.addColorStop(0, 'rgba(255, 0, 0, 1)');
    grd1.addColorStop(0.17, 'rgba(255, 255, 0, 1)');
    grd1.addColorStop(0.34, 'rgba(0, 255, 0, 1)');
    grd1.addColorStop(0.51, 'rgba(0, 255, 255, 1)');
    grd1.addColorStop(0.68, 'rgba(0, 0, 255, 1)');
    grd1.addColorStop(0.85, 'rgba(255, 0, 255, 1)');
    grd1.addColorStop(1, 'rgba(255, 0, 0, 1)');
    ctx2.fillStyle = grd1;
    ctx2.fill();

    this.setBlockColor();
    this.setPickerColor();

    // color block
    this.bound_colorBlockMouseDown = this.colorBlockMouseDown.bind(this);
    this.bound_colorBlockMouseUp = this.colorBlockMouseUp.bind(this);
    this.bound_colorBlockMouseMove = this.colorBlockMouseMove.bind(this);
    this.colorBlock.addEventListener('mousedown', this.bound_colorBlockMouseDown);

    // color strip
    this.bound_colorStripMouseDown = this.colorStripMouseDown.bind(this);
    this.bound_colorStripMouseUp = this.colorStripMouseUp.bind(this);
    this.bound_colorStripMouseMove = this.colorStripMouseMove.bind(this);
    this.colorStrip.addEventListener('mousedown', this.bound_colorStripMouseDown);
  }

  disconnectedCallback() {
    // color block
    this.colorBlock.removeEventListener('mousedown', this.bound_colorBlockMouseDown);
    document.removeEventListener('mouseup', this.bound_colorBlockMouseUp);
    document.removeEventListener('mousemove', this.bound_colorBlockMouseMove);

    // color strip
    this.colorStrip.removeEventListener('mousedown', this.bound_colorStripMouseDown);
    document.removeEventListener('mouseup', this.bound_colorStripMouseUp);
    document.removeEventListener('mousemove', this.bound_colorStripMouseMove);
  }

  static get observedAttributes() {
    return ['max-rgb-range'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'max-rgb-range') this.maxRGBRange = newValue;
  }

  get color() {
    const multiplier = this.maxRGBRange / 255;
    const values = this.pickerColor.replace('rgba(', '').replace(')', '').split(',');
    return [...values.slice(0, 3).map(v => v * multiplier), 1];
  }

  get maxRGBRange() {
    return this.maxRGBRange_ || 255;
  }

  set maxRGBRange(value) {
    if (value < 3) value = 3;
    if (value > 255) value = 255;
    this.maxRGBRange_ = value;
  }

  get colorBlock() {
    if (!this.colorBlock_) this.colorBlock_ = this.shadowRoot.querySelector('#color-block');
    return this.colorBlock_;
  }

  get colorBlockContext() {
    return this.colorBlock.getContext('2d');
  }

  get colorStrip() {
    return this.shadowRoot.querySelector('#color-strip');
  }

  get colorStripContext() {
    return this.colorStrip.getContext('2d');
  }

  get currentColor() {
    return this.shadowRoot.querySelector('#current-color');
  }

  get currentColorContext() {
    return this.currentColor.getContext('2d');
  }

  get picker() {
    if (!this.picker_) this.picker_ = this.shadowRoot.querySelector('.picker');
    return this.picker_;
  }

  get striper() {
    if (!this.striper_) this.striper_ = this.shadowRoot.querySelector('.striper');
    return this.striper_;
  }

  get pickingContainer() {
    return this.shadowRoot.querySelector('.picking-container');
  }

  get rInput() {
    return this.shadowRoot.querySelector('input[name="r-value"]');
  }

  get gInput() {
    return this.shadowRoot.querySelector('input[name="g-value"]');
  }

  get bInput() {
    return this.shadowRoot.querySelector('input[name="b-value"]');
  }

  setBlockColor() {
    const ctx3 = this.currentColorContext;
    ctx3.fillStyle = this.pickerColor;
    ctx3.fillRect(0, 0, this.colorStripWidth, this.colorBlockSize);
  }

  setPickerColor() {
    const x = this.pickerX - this.colorStripWidth;
    const y = this.pickerY;
    this.pickerColor = `rgba(${[...this.colorBlockContext.getImageData(x, y, 1, 1).data].slice(0, 3).join(',')},1)`;
    if (x === 0 && y === 0) this.pickerColor = 'rgba(255,255,255,0)';
    this.picker.style.backgroundColor = this.pickerColor;
    this.setRGBInputs();
    this.handleChange();
  }

  updatePicker(x, y) {
    const rect = this.colorBlock.getBoundingClientRect();
    x -= rect.left;
    x += this.colorStripWidth;
    y -= rect.top;
    if (x > this.colorBlockSize + this.colorStripWidth - 1) x = this.colorBlockSize + this.colorStripWidth - 1;
    if (x < this.colorStripWidth) x = this.colorStripWidth;
    if (y < 0) y = 0;
    if (y > this.colorBlockSize) y = this.colorBlockSize;

    // get image data for color
    this.pickerX = x;
    this.pickerY = y;

    // offset picker
    if (x < this.colorStripWidth + 5) x = this.colorStripWidth + 5;
    // set picker position
    this.picker.style.left = `${x}px`;
    this.picker.style.top = `${y}px`;
    this.setPickerColor();
  }

  updateStriper(y) {
    const rect = this.colorStrip.getBoundingClientRect();
    y -= rect.top;
    if (y < 0) y = 0;
    if (y > this.colorBlockSize) y = this.colorBlockSize;

    this.rgbaColor = `rgba(${[...this.colorStripContext.getImageData(1, y, 1, 1).data].slice(0, 3).join(',')},1)`;
    this.striper.style.top = `${y}px`;
    this.fillGradient();
    this.setPickerColor();
  }

  fillGradient() {
    const ctx1 = this.colorBlockContext;
    const ctx2 = this.colorStripContext;

    ctx1.fillStyle = this.rgbaColor;
    ctx1.fillRect(0, 0, this.colorBlockSize, this.colorBlockSize);

    const grdWhite = ctx2.createLinearGradient(0, 0, this.colorBlockSize, 0);
    grdWhite.addColorStop(0, 'rgba(255,255,255,1)');
    grdWhite.addColorStop(1, 'rgba(255,255,255,0)');
    ctx1.fillStyle = grdWhite;
    ctx1.fillRect(0, 0, this.colorBlockSize, this.colorBlockSize);

    const grdBlack = ctx2.createLinearGradient(0, 0, 0, this.colorBlockSize);
    grdBlack.addColorStop(0, 'rgba(0,0,0,0)');
    grdBlack.addColorStop(1, 'rgba(0,0,0,1)');
    ctx1.fillStyle = grdBlack;
    ctx1.fillRect(0, 0, this.colorBlockSize, this.colorBlockSize);
  }

  setRGBInputs() {
    const values = this.pickerColor.replace('rgba(', '').replace(')', '').split(',');
    this.rInput.value = values[0];
    this.gInput.value = values[1];
    this.bInput.value = values[2];
  }


  // --- color block mouse events ---

  colorBlockMouseDown(e) {
    this.isColorBlockMouseDown = true;
    this.pickingContainer.classList.add('no-mouse');
    this.updatePicker(e.clientX, e.clientY);
    document.addEventListener('mouseup', this.bound_colorBlockMouseUp);
    document.addEventListener('mousemove', this.bound_colorBlockMouseMove);
  }

  colorBlockMouseUp() {
    this.isColorBlockMouseDown = false;
    this.pickingContainer.classList.remove('no-mouse');
    this.setBlockColor();
  }

  colorBlockMouseMove(e) {
    if (this.isColorBlockMouseDown) {
      this.updatePicker(e.clientX, e.clientY);
    }
  }


  // --- color strip mouse events ---

  colorStripMouseDown(e) {
    this.isColorStripMouseDown = true;
    this.pickingContainer.classList.add('no-mouse');
    this.updateStriper(e.clientY);
    document.addEventListener('mouseup', this.bound_colorStripMouseUp);
    document.addEventListener('mousemove', this.bound_colorStripMouseMove);
  }

  colorStripMouseUp() {
    this.isColorStripMouseDown = false;
    this.pickingContainer.classList.remove('no-mouse');
    // this.setBlockColor();
  }

  colorStripMouseMove(e) {
    if (this.isColorStripMouseDown) {
      this.updateStriper(e.clientY);
    }
  }

  handleChange() {
    this.dispatchEvent(new CustomEvent('change', {
      detail: {
        color: this.color
      }
    }));
  }

  styles() {
    return css`
      :host {
        display: block;
      }

      .picking-container {
        vertical-align: top;
        position: relative;
        height: 150px;
        width: 300px;
        padding: 5px;
        user-select: none;
      }

      .picker {
        height: 10px;
        width: 10px;
        border: 1px white solid;
        border-radius: 11px;
        position: absolute;
        cursor: pointer;
        z-index: 10;
        user-select: none;
      }

      .striper {
        height: 2px;
        left: 192px;
        width: ${this.colorStripWidth}px;
        border: 1px white solid;
        position: absolute;
        cursor: pointer;
        z-index: 10;
        user-select: none;
      }

      .picking-container.no-mouse { cursor: none; }
      .picking-container.no-mouse .picker { cursor: none; }
      .picking-container.no-mouse .striper { cursor: none; }

      .rgba-values {
        display: inline-block;
        vertical-align: top;
        width: 65px;
        padding-left: 8px;
      }

      .input-container {
        flex: 1;
        display: flex;
        flex-direction: row;
        padding-bottom: 6px;
      }

      .input-container label {
        font-size: 14px;
        width: 24px;
      }

      .input-container input {
        width: 40px;
      }
    `;
  }

  template() {
    return html`
      <div class="picking-container">
        <div class="picker" style="left: ${this.colorBlockSize + this.colorStripWidth}px; top: 0px;"></div>
        <div class="striper" style="top: 10px;"></div>
        <canvas id="current-color" height="${this.colorBlockSize}" width="${this.colorStripWidth}"></canvas>
        <canvas id="color-block" height="${this.colorBlockSize}" width="${this.colorBlockSize}"></canvas>
        <canvas id="color-strip" height="${this.colorBlockSize}" width="${this.colorStripWidth}"></canvas>
        <div class="rgba-values">
          <div class="input-container">
            <label for="r-value">R</label>
            <input name="r-value">
          </div>

          <div class="input-container">
            <label for="g-value">G</label>
            <input name="g-value">
          </div>

          <div class="input-container">
            <label for="b-value">B</label>
            <input name="b-value">
          </div>
        </div>
      </div>
    `;
  }
});
