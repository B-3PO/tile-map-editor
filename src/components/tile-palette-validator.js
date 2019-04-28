const {
  customElements,
  HTMLElementExtended,
  html,
  css
} = require('@webformula/pax-core');

customElements.define('tile-palette-validator', class extends HTMLElementExtended {
  constructor() {
    super();
    this.cloneTemplate();
  }

  connectedCallback() {
    this.tilePaletteChecker = new TilePaletteChecker(this.canvas, this.paletteTool);
    this.bound_onCheckboxChange = this.onCheckboxChange.bind(this);
    this.checkbox.addEventListener('change', this.bound_onCheckboxChange);
  }

  disconnectedCallback() {
    this.checkbox.removeEventListener('change', this.bound_onCheckboxChange);
  }

  get canvas() {
    return this.canvas_;
  }

  set canvas(value) {
    this.canvas_ = value;
    this.tilePaletteChecker.canvas = value;
  }

  get paletteTool() {
    return this.paletteTool_;
  }

  set paletteTool(value) {
    this.paletteTool_ = value;
    this.tilePaletteChecker.paletteTool = value;
  }

  get checkbox() {
    return this.shadowRoot.querySelector('input[type="checkbox"]');
  }

  check() {
    this.data = this.tilePaletteChecker.check();
    this.checkbox.removeEventListener('change', this.bound_onCheckboxChange);
    this.render();
    this.checkbox.addEventListener('change', this.bound_onCheckboxChange);
  }

  showCanvas() {
    this.canvas.tileValidation = this.data;
    this.canvas.showTileValidation();
  }

  hideCanvas() {
    this.canvas.hideTileValidation();
  }

  onCheckboxChange(e) {
    if (this.checkbox.checked) {
      this.checked_ = true;
      this.check();
      this.showCanvas();
    } else {
      this.checked_ = false;
      this.hideCanvas();
    }
  }

  styles() {
    return css`
      :host {
        display: block;
        background-color: #DDD;
        border: 1px solid #AAA;
        border-radius: 3px;
        padding: 4px;
        padding-right: 8px;
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
    `;
  }


  template() {
    return html`
      <div>
        <input type="checkbox" ${this.checked_ ? 'checked' : ''}>
        <label>Tile validation mode</label>
      </div>
      <div>
        <span class="label">Invalid tiles: </span><span>${this.data ? this.data.invalidTiles.length : ''}</span>
      </div>
    `;
  }
});
