const {
  customElements,
  HTMLElementExtended,
  html,
  css
} = require('@webformula/pax-core');

customElements.define('tile-palette-validator', class extends HTMLElementExtended {
  constructor() {
    super();

    this.tileDisplayWidth = 80;
    this.tileDisplayHeight = 80;
    this.tileDrawScale = 10;

    this.cloneTemplate();
  }

  connectedCallback() {
    this.tilePaletteChecker = new TilePaletteChecker(this.canvas, this.paletteTool);
    this.bound_onTileSelect = this.onTileSelect.bind(this);
    this.bound_onCheckboxChange = this.onCheckboxChange.bind(this);
    this.bound_enableDrawClick = this.enableDrawClick.bind(this);
    this.bound_onPaint = this.onPaint.bind(this);
    this.bound_onPaletteChange = this.onPaletteChange.bind(this);
    this.addEvents();
  }

  disconnectedCallback() {
    this.removeEvents();
  }

  beforeRender() {
    this.removeEvents();
  }

  afterRender() {
    this.addEvents();
  }

  addEvents() {
    this.validationModeCheckbox.addEventListener('change', this.bound_onCheckboxChange);
    this.enableDrawCheckbox.addEventListener('change', this.bound_enableDrawClick);

    if (this.paletteTool) {
      if (this.validationModeChecked_) this.paletteTool.addEventListener('paletteChange', this.bound_onPaletteChange);
    }

    if (this.canvas_) {
      this.canvas_.addEventListener('tileSelect', this.bound_onTileSelect);
      if (this.drawEnabled) this.canvas_.addEventListener('paint', this.bound_onPaint);
    }
  }

  removeEvents() {
    this.validationModeCheckbox.removeEventListener('change', this.bound_onCheckboxChange);
    this.enableDrawCheckbox.removeEventListener('change', this.bound_enableDrawClick);

    if (this.paletteTool) this.paletteTool.removeEventListener('paletteChange', this.bound_onPaletteChange);

    if (this.canvas_) {
      this.canvas_.removeEventListener('tileSelect', this.bound_onTileSelect);
      this.canvas_.removeEventListener('paint', this.bound_onPaint);
    }
  }

  get canvas() {
    return this.canvas_;
  }

  set canvas(value) {
    this.canvas_ = value;
    // calculate width based on aspect ratio of tile
    this.tileDisplayWidth = (this.canvas_.tileWidth / this.canvas_.tileHeight) * this.tileDisplayHeight;
    this.tileDrawScale = this.tileDisplayHeight / this.canvas_.tileHeight;
    this.tilePaletteChecker.canvas = value;
    this.canvas_.addEventListener('tileSelect', this.bound_onTileSelect);
  }

  get paletteTool() {
    return this.paletteTool_;
  }

  set paletteTool(value) {
    this.paletteTool_ = value;
    this.tilePaletteChecker.paletteTool = value;
  }

  get validationModeCheckbox() {
    return this.shadowRoot.querySelector('#validation-mode-checkbox');
  }

  get enableDrawCheckbox() {
    return this.shadowRoot.querySelector('#enable-draw');
  }

  enableDrawClick(e) {
    if (this.drawEnabled) {
      this.disableDraw();
    } else {
      this.enableDraw();
    }
  }

  enableDraw() {
    this.drawEnabled = true;
    this.canvas.enableDrawEvents();
    this.canvas.addEventListener('paint', this.bound_onPaint);
  }

  disableDraw() {
    this.drawEnabled = false;
    this.canvas.enableTileValidationEvents();
    this.canvas.removeEventListener('paint', this.bound_onPaint);
  }

  check() {
    this.data = this.tilePaletteChecker.check();
    this.canvas.tileValidation = this.data;
    this.render();
  }

  showCanvas() {
    this.canvas.showTileValidation();
  }

  hideCanvas() {
    this.canvas.hideTileValidation();
  }

  onCheckboxChange(e) {
    if (this.validationModeCheckbox.checked) {
      this.validationModeChecked_ = true;
      this.check();
      this.showCanvas();
      this.paletteTool.addEventListener('paletteChange', this.bound_onPaletteChange);
    } else {
      this.validationModeChecked_ = false;
      this.selected = undefined;
      this.hideCanvas();
      this.render();
      this.paletteTool.removeEventListener('paletteChange', this.bound_onPaletteChange);
    }
  }

  onTileSelect(e) {
    this.selected = e.detail.selectedTile;
    this.render();
    this.drawTile();
  }

  drawTile() {
    const tileCanvas = this.shadowRoot.querySelector('#selected-tile-canvas');
    if (!tileCanvas) return;

    const ctx = tileCanvas.getContext('2d');
    const pixelScale = this.tileDrawScale;
    const tileData = this.data.rawTileData[this.selected];
    const pixelsX = this.canvas.tileWidth;
    const pixelsY = this.canvas.tileHeight;
    let x;
    let y = 0;

    this.clearTile();

    for(; y < pixelsY; y += 1) {
      for(x = 0; x < pixelsX; x += 1) {
        ctx.fillStyle = `rgba(${tileData[y * pixelsX + x].join(',')})`;
        ctx.fillRect(x * pixelScale, y * pixelScale, pixelScale, pixelScale);
      }
    }
  }

  clearTile() {
    this.shadowRoot.querySelector('#selected-tile-canvas').width = this.tileDisplayWidth;
  }

  onPaint() {
    this.check();
    this.drawTile();
  }

  onPaletteChange(e) {
    console.log('paletteChange');
    this.check();
    this.drawTile();
  }

  styles() {
    return css`
      :host {
        display: block;
        background-color: #DDD;
        border-left: 1px solid #AAA;
        border-right: 1px solid #AAA;
        padding: 4px;
        padding-right: 8px;
      }

      .sub-header {
        font-size: 16px;
        color: #777;
        margin-bottom: 4px;
      }

      label {
        color: #666;
        font-size: 14px;
        font-weight: bold;
        padding-right: 6px;
      }

      .label {
        font-size: 14px;
        font-weight: bold;
        color: #777;
      }

      .value {
        width: 40px;
        padding-left: 4px;
      }

      .row {
        display: flex;
        flex-direction: row;
      }

      .column {
        display: flex;
        flex-direction: column;
      }

      section {
        margin-top: 6px;
        padding: 6px;
      }

      .reason {
        font-size: 12px;
        color: #777;
        margin-top: -8px;
        margin-left: 1px;
        margin-bottom: 12px;
      }

      .reason.warn {
        color: #ff3a3a;
      }

      .reason.success {
        color: #8aff39;
      }
    `;
  }


  template() {
    const valid = this.selected !== undefined ? this.data.tileValidationData[this.selected].valid : false;
    return html`
      <div class="row">
        <input id="validation-mode-checkbox" type="checkbox" ${this.validationModeChecked_ ? 'checked' : ''}>
        <label style="padding-right: 8px;">Tile validation mode</label>
        <input id="enable-draw" type="checkbox" ${this.drawEnabled ? 'checked' : ''} >
        <label>Enable draw</label>


        <span style="flex: 1"></span>
        <span class="label">Invalid tiles: </span><span class="value">${this.data ? this.data.invalidTiles.length : ''}</span>
      </div>

      <section>
        <div class="sub-header">Selected tile</div>
        <div>
          ${this.selected === undefined ?
            html`
              <div class="reason">No tile selected</div>
            ` :
            html`
              <div class="reason warn" style="${!valid ? '' : 'display: none;'}">${this.data.tileValidationData[this.selected].reason}</div>
              <div class="reason success" style="${valid ? '' : 'display: none;'}">Valid</div>
              <div class="row">
                <canvas id="selected-tile-canvas" width="${this.tileDisplayWidth}" height="${this.tileDisplayHeight}"></canvas>
              </div>
            `
          }
        </div>
      </section>
    `;
  }
});
