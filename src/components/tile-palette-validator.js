const {
  customElements,
  HTMLElementExtended,
  html,
  css
} = require('@webformula/pax-core');
const TilePaletteChecker = require('../global/TilePaletteChecker');

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
    this.bound_onPaletteChange = this.onPaletteChange.bind(this);
    this.bound_paletteTileClick = this.paletteTileClick.bind(this);
    this.bound_applyChanges = this.applyChanges.bind(this);
    this.addEvents();
  }

  disconnectedCallback() {
    this.removeEvents();
  }

  beforeRender() {
    this.removeEvents();
  }

  afterRender() {
    const colorDisplays = [...this.shadowRoot.querySelectorAll('palette-display')];
    if (colorDisplays.length) {
      const selected = colorDisplays.shift();
      selected.colors = this.selectedPalette;
      colorDisplays.forEach((el, i) => el.colors = this.paletteTool.palettes[i])
    }
    this.addEvents();
  }

  addEvents() {
    this.validationModeCheckbox.addEventListener('change', this.bound_onCheckboxChange);

    if (this.paletteTool) {
      if (this.validationModeChecked_) this.paletteTool.addEventListener('paletteChange', this.bound_onPaletteChange);
    }

    if (this.canvas_) {
      this.canvas_.addEventListener('tileSelect', this.bound_onTileSelect);
    }

    const paletteTiles = [...this.shadowRoot.querySelectorAll('.palette-tile')];
    paletteTiles.forEach(el => el.addEventListener('click', this.bound_paletteTileClick));
    if (this.shadowRoot.querySelector('#apply-changes')) this.shadowRoot.querySelector('#apply-changes').addEventListener('click', this.bound_applyChanges);
  }

  removeEvents() {
    this.validationModeCheckbox.removeEventListener('change', this.bound_onCheckboxChange);

    if (this.paletteTool) this.paletteTool.removeEventListener('paletteChange', this.bound_onPaletteChange);

    if (this.canvas_) {
      this.canvas_.removeEventListener('tileSelect', this.bound_onTileSelect);
    }

    const paletteTiles = [...this.shadowRoot.querySelectorAll('.palette-tile')];
    paletteTiles.forEach(el => el.removeEventListener('click', this.bound_paletteTileClick));
    if (this.shadowRoot.querySelector('#apply-changes')) this.shadowRoot.querySelector('#apply-changes').addEventListener('click', this.bound_applyChanges);
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

  get tileData() {
    if (!this.tileData_) this.tileData_ = this.data.rawTileData[this.selected];
    return this.tileData_;
  }

  set tileData(value) {
    this.tileData_ = value;
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
    this.selectedValidation = this.data.tileValidationData[this.selected];
    this.selectedPalette = this.selectedValidation.palette;
    this.originalPalette = this.selectedPalette !== undefined ? this.selectedPalette : this.createTempPalette();
    this.preventTileDataReload = false;
    this.render();
    this.drawPaletteVariations();
  }

  paletteTileClick(e) {
    const id = e.target.getAttribute('id');
    const index = id.split('-').pop();
    this.selectedPalette = this.paletteTool.palettes[index];
    this.render();
    this.drawPaletteVariations();
    this.shadowRoot.querySelector('#apply-changes').addEventListener('click', this.bound_applyChanges);
  }

  drawTile(selector, palette) {
    const tileCanvas = this.shadowRoot.querySelector(selector);
    if (!tileCanvas) return;

    const ctx = tileCanvas.getContext('2d');
    if (!palette) {
      ctx.stokeStyle = 'red';
      ctx.strokeRect(0, 0, 80, 80);
      return;
    }

    const isSelectedTile = selector === '#selected-tile-canvas';
    if (isSelectedTile) this.selectedTileData = [];
    const pixelScale = this.tileDrawScale;
    const tileData = this.tileData;
    const pixelsX = this.canvas.tileWidth;
    const pixelsY = this.canvas.tileHeight;
    let x;
    let y = 0;
    let palettePosition;
    let currentPixelColor;

    for(; y < pixelsY; y += 1) {
      for(x = 0; x < pixelsX; x += 1) {
        currentPixelColor = this.tilePaletteChecker.RGBAtoInt(tileData[y * pixelsX + x]);
        palettePosition = this.originalPalette.map(c => this.tilePaletteChecker.RGBAtoInt(c)).indexOf(currentPixelColor);
        ctx.fillStyle = `rgba(${palette[palettePosition]})`;
        // console.log(currentPixelColor, palettePosition, this.originalPalette, palette);
        ctx.fillRect(x * pixelScale, y * pixelScale, pixelScale, pixelScale);
        if (isSelectedTile) {
          this.selectedTileData.push(palette[palettePosition]);
        }
      }
    }
  }

  createTempPalette() {
    const tileColors = this.data.tileValidationData[this.selected].colors.sort().map(c => this.tilePaletteChecker.intToRGBAArray(c));
    if (tileColors.length < 4) {
      let i = tileColors.length;
      const length = 4;
      for(; i < length; i += 1) {
        tileColors.push([i * 50, i * 50, i * 50, 1]);
      }
    }
    return tileColors;
  }

  drawPaletteVariations() {
    this.clearTiles();

    // draw current tile in selected spot
    this.drawTile('#selected-tile-canvas', this.selectedPalette);

    this.paletteTool.palettes.forEach((palette, i) => {
      this.drawTile(`#palette-tile-canvas-${i}`, palette);
    });
  }

  clearTiles() {
    this.shadowRoot.querySelector('#selected-tile-canvas').width = this.tileDisplayWidth;
    this.paletteTool.palettes.forEach((palette, i) => {
      this.shadowRoot.querySelector(`#palette-tile-canvas-${i}`).width = this.tileDisplayWidth;
    });
  }

  onPaletteChange(e) {
    this.check();
    this.selectedValidation = this.data.tileValidationData[this.selected];
    this.drawPaletteVariations();
  }

  applyChanges(e) {
    this.canvas.drawTile(this.selected, this.selectedTileData);
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

      .tile-spacer {
        height: 80px;
        margin-left: 24px;
        margin-right: 24px;
        border-left: 1px solid #444;
      }

      .palette-displays,
      .palette-tile {
        margin-right: 24px;
        border: 2px solid rgba(0, 0, 0, 0);
      }

      .palette-tile:hover {
        border: 2px solid rgb(0, 255, 48);
        cursor: pointer;
      }

      .selected-display {
        margin-right: 49px;
      }

      button {
        cursor: pointer;
      }
    `;
  }


  template() {
    const valid = this.selected !== undefined ? this.data.tileValidationData[this.selected].valid : false;
    return html`
      <div class="row">
        <input id="validation-mode-checkbox" type="checkbox" ${this.validationModeChecked_ ? 'checked' : ''}>
        <label style="padding-right: 8px;">Tile validation mode</label>


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
                <palette-display class="selected-display"></palette-display>

                ${this.paletteTool.palettes.map((palette, i) => html`
                  <palette-display class="palette-displays"></palette-display>
                `).join('\n')}
              </div>
              <div class="row">
                <canvas id="selected-tile-canvas" width="${this.tileDisplayWidth}" height="${this.tileDisplayHeight}"></canvas>
                <div class="tile-spacer"></div>
                ${this.paletteTool.palettes.map((palette, i) => html`
                  <canvas id="palette-tile-canvas-${i}" class="palette-tile" width="${this.tileDisplayWidth}" height="${this.tileDisplayHeight}"></canvas>
                `).join('\n')}

                <button id="apply-changes">Apply change</button>
              </div>
            `
          }
        </div>
      </section>
    `;
  }
});
