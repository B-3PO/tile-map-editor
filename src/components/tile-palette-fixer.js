const {
  customElements,
  HTMLElementExtended,
  html,
  css
} = require('@webformula/pax-core');
const ColorUtils = require('../global/ColorUtils');

customElements.define('tile-palette-fixer', class extends HTMLElementExtended {
  constructor() {
    super();

    this.colors = [];
    this.colorConversions = [];
    this.palette = [];
    this.scale = 20;
    this.tileWidth_ = parseInt(this.getAttribute('tile-width') || 8);
    this.tileHeight_ = parseInt(this.getAttribute('tile-height') || 8);
    this.bound_ok = this.ok.bind(this);
    this.bound_fixAll = this.fixAll.bind(this);
    this.bound_cancel = this.cancel.bind(this);
    this.bound_conversionClick = this.conversionClick.bind(this);
    this.bound_colorClick = this.colorClick.bind(this);
    this.bound_paletteClick = this.paletteClick.bind(this);

    this.cloneTemplate();
  }

  connectedCallback() {
    this.addEvents()
  }

  disconnectedCallback() {
    this.removeEvents();
  }

  beforeEvents() {
    this.addEvents();
  }

  afterRender() {
    this.addEvents();
  }

  addEvents() {
    this.shadowRoot.querySelector('#ok').addEventListener('click', this.bound_ok);
    this.shadowRoot.querySelector('#all').addEventListener('click', this.bound_fixAll);
    this.shadowRoot.querySelector('#cancel').addEventListener('click', this.bound_cancel);
    this.shadowRoot.querySelector('.conversion-container').addEventListener('click', this.bound_conversionClick);
    this.shadowRoot.querySelector('.colors-container').addEventListener('click', this.bound_colorClick);
    this.shadowRoot.querySelector('.all-colors-container').addEventListener('click', this.bound_colorClick);
    this.shadowRoot.querySelector('.palette-container').addEventListener('click', this.bound_paletteClick);
  }

  removeEvents() {
    this.shadowRoot.querySelector('#ok').removeEventListener('click', this.bound_ok);
    this.shadowRoot.querySelector('#all').removeEventListener('click', this.bound_fixAll);
    this.shadowRoot.querySelector('#cancel').removeEventListener('click', this.bound_cancel);
    this.shadowRoot.querySelector('.conversion-container').removeEventListener('click', this.bound_conversionClick);
    this.shadowRoot.querySelector('.colors-container').removeEventListener('click', this.bound_colorClick);
    this.shadowRoot.querySelector('.all-colors-container').removeEventListener('click', this.bound_colorClick);
    this.shadowRoot.querySelector('.palette-container').removeEventListener('click', this.bound_paletteClick);
  }

  get tileWidth() {
    return this.tileWidth_;
  }

  get tileHeight() {
    return this.tileHeight_;
  }

  get canvas() {
    return this.shadowRoot.querySelector('#canvas');
  }

  get tileData() {
    return this.tileData_;
  }

  get drawCanvas() {
    return this.drawCanvas_;
  }

  set drawCanvas(value) {
    this.drawCanvas_ = value;
  }

  set tileData(value) {
    this.tileData_ = value;
    this.getColors();
    this.render();
    this.drawTile(value);
  }

  get allColors() {
    return this.allColors_ || [];
  }

  set allColors(value) {
    this.allColors_ = value;
  }

  get selected() {
    return this.selected_;
  }

  set selected(value) {
    this.selected_ = value;
  }

  setData(selected, tileData, allColors, drawCanvas) {
    this.selected = selected;
    this.allColors = allColors;
    this.tileData = tileData;
    this.drawCanvas = drawCanvas;
  }

  getColors() {
    const data = this.tileData;
    const pixelScale = this.scale;
    const pixelsX = this.tileWidth;
    const pixelsY = this.tileHeight;
    let x;
    let y = 0;

    this.colors = {};
    for(; y < pixelsY; y += 1) {
      for(x = 0; x < pixelsX; x += 1) {
        this.colors[ColorUtils.RGBAtoInt(data[y * pixelsX + x])] = data[y * pixelsX + x];
      }
    }
    this.colors = Object.keys(this.colors).map(k => this.colors[k]);
    this.palette = this.colors.map(c => c).slice(0, 4);
  }

  drawTile() {
    const data = this.tileData;
    const pixelScale = this.scale;
    const pixelsX = this.tileWidth;
    const pixelsY = this.tileHeight;
    const ctx = this.canvas.getContext('2d');
    const intColors = this.colors.map(ColorUtils.RGBAtoInt);
    let x;
    let y = 0;
    let color;
    let colorPosition;
    this.convertedTileData = [];

    for(; y < pixelsY; y += 1) {
      for(x = 0; x < pixelsX; x += 1) {
        color = data[y * pixelsX + x];
        colorPosition = intColors.indexOf(ColorUtils.RGBAtoInt(data[y * pixelsX + x]));
        if (this.colorConversions[colorPosition]) color = this.colorConversions[colorPosition];
        ctx.fillStyle = `rgba(${color})`;
        ctx.fillRect(x * pixelScale, y * pixelScale, pixelScale, pixelScale);
        this.convertedTileData.push(color);
      }
    }
  }

  compareColors(a, b) {
    return ColorUtils.RGBAtoInt(a) === ColorUtils.RGBAtoInt(b);
  }

  paletteClick(e) {
    if (this.selectedConversionColor) this.selectedConversionColor.classList.remove('selected');
    if (this.selectedPaletteColor) this.selectedPaletteColor.classList.remove('selected');
    this.selectedConversionColor = undefined;
    this.selectedPaletteColor = e.target;
    this.selectedPaletteColor.classList.add('selected');
  }

  conversionClick(e) {
    if (this.selectedPaletteColor) this.selectedPaletteColor.classList.remove('selected');
    if (this.selectedConversionColor) this.selectedConversionColor.classList.remove('selected');
    this.selectedPaletteColor = undefined;
    this.selectedConversionColor = e.target;
    this.selectedConversionColor.classList.add('selected');
  }

  colorClick(e) {
    if (this.selectedConversionColor) {
      this.selectedConversionColor.style.backgroundColor = e.target.style.backgroundColor;
      this.colorConversions[parseInt(this.selectedConversionColor.getAttribute('location'))] = [...e.target.style.backgroundColor.replace('rgb(', '').replace(')', '').split(',').map(i => parseInt(i)), 1];
      this.drawTile();
    }

    if (this.selectedPaletteColor) {
      this.selectedPaletteColor.style.backgroundColor = e.target.style.backgroundColor;
      this.palette[parseInt(this.selectedPaletteColor.getAttribute('location'))] = [...e.target.style.backgroundColor.replace('rgb(', '').replace(')', '').split(',').map(i => parseInt(i)), 1];
    }
  }

  ok() {
    this.drawCanvas.drawTile(this.selected, this.convertedTileData);
    this.dispatchChange();
    this.remove();
  }

  fixAll() {
    const originalColors = this.colors.reduce((a, c, i) => {
      a[this.drawCanvas.RGBAtoInt(c)] = this.colorConversions[i] || this.colors[i];
      return a;
    }, {})
    this.drawCanvas.remapTilesPalette(originalColors);
    this.dispatchChange();
    this.remove();
  }

  cancel() {
    this.remove();
  }

  dispatchChange() {
    this.dispatchEvent(new CustomEvent('change', {
      detail: {}
    }));
  }

  styles() {
    return css`
      :host {
        display: block;
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 11;
        background-color: rgba(0, 0, 0, 0.5);
      }

      .container {
        display: inline-block;
        position: relative;
        left: 50%;
        top: 50%;
        width: 360px;
        height: auto;
        transform: translate(-50%, -50%);

        background-color: #DDD;
        border: 1px solid #999;
        border-radius: 3px;
        box-shadow: 0 5px 5px -3px rgba(0,0,0,.2),
                    0 8px 10px 1px rgba(0,0,0,.14),
                    0 3px 14px 2px rgba(0,0,0,.12);
      }

      .title {
        font-size: 22px;
        color: #444;
        margin-bottom: 24px;
      }

      .sub-title {
        font-size: 20px;
        color: #444;
        margin-bottom: 18px;
      }

      .sub-header {
        font-size: 16px;
        color: #777;
        margin-bottom: 4px;
      }

      .content {
        padding: 24px;
      }

      .row {
        display: flex;
        flex-direction: row;
      }

      .column {
        display: flex;
        flex-direction: column;
      }

      .wrap {
        flex-wrap: wrap;
      }

      .controls {
        margin-top: 24px;
      }

      .button,
      button {
        align-items: center;
        border: none;
        border-radius: 4px;
        box-sizing: border-box;
        display: inline-flex;
        font-size: 14px;
        font-weight: 500;
        height: 33px;
        justify-content: center;
        line-height: 32px;
        min-width: 64px;
        outline: none;
        overflow: hidden;
        padding: 0 8px 0 8px;
        position: relative;
        vertical-align: middle;
        margin: 0;
        background-color: white;
      }

      .button:hover,
      button:hover {
        cursor: pointer;
        background-color: #EEE;
      }

      #ok,
      #all {
        margin-right: 6px;
      }

      .colors-container {
        margin-left: 22px;
      }

      .color-block {
        width: 24px;
        height: 24px;
        border: 2px solid rgba(53, 133, 185, 0);
      }

      .colors-container .color-block {
        margin-bottom: 5px;
        cursor: pointer;
      }

      .conversion-container,
      .palette-container {
        margin-left: 10px;
      }

      .conversion-container .color-block,
      .palette-container .color-block {
        margin-bottom: 5px;
        cursor: pointer;
      }

      .conversion-container .color-block.selected,
      .palette-container .color-block.selected {
        border: 2px solid rgb(53, 133, 185);
      }

      .conversion-container .color-block:not(.selected):hover,
      .palette-container .color-block:not(.selected):hover {
        border: 2px solid rgb(53, 133, 185, 0.5);
      }

      .all-colors-container {
        margin: 24px 0;
      }

      .all-colors-container .color-block {
        margin: 4px;
      }
    `;
  }


  template() {
    return html`
      <div class="container">
        <div class="content">
          <div class="title">Fix Tile Palette</div>

          <div class="column">
            <div class="row">
              <div id="canvas-container">
                <canvas id="canvas" width="${this.tileWidth * this.scale}" height="${this.tileHeight * this.scale}"></canvas>
              </div>

              <div class="colors-container column">
                ${this.colors.map((c, i) => {
                    return `<div class="color-block" style="background-color: rgba(${c})" location="${i}"></div>`;
                  }).join('\n')}
              </div>

              <div class="conversion-container column">
                ${this.colors.map((c, i) => {
                    return `<div class="color-block" style="background-color: rgba(${this.colorConversions[i] || c})" location="${i}"></div>`;
                  }).join('\n')}
              </div>

              <div class="palette-container column">
                ${this.palette.map((c, i) => {
                    return `<div class="color-block" style="background-color: rgba(${c})" location="${i}"></div>`;
                  }).join('\n')}
              </div>
            </div>

            <div>
              <div class="all-colors-container row wrap">
                ${this.allColors.map((c, i) => {
                    return `<div class="color-block" style="background-color: rgba(${c})" location="${i}"></div>`;
                  }).join('\n')}
              </div>
            </div>
          </div>

          <div class="row">
            <button id="ok">Update</button>
            <button id="all">Update All</button>
            <button id="cancel">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }
});
