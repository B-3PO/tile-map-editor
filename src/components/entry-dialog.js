const {
  customElements,
  HTMLElementExtended,
  html,
  css
} = require('@webformula/pax-core');

customElements.define('entry-dialog', class extends HTMLElementExtended {
  constructor() {
    super();
    this.cloneTemplate();
  }

  connectedCallback() {
    this.bound_create = this.create.bind(this);
    this.createButton.addEventListener('click', this.bound_create);
  }

  disconnectedCallback() {
    this.createButton.removeEventListener('click', this.bound_create);
  }

  get createButton() {
    return this.shadowRoot.querySelector('#create');
  }

  get pixelsX() {
    return this.shadowRoot.querySelector('input[name="pixels-x"]').value;
  }

  get pixelsY() {
    return this.shadowRoot.querySelector('input[name="pixels-y"]').value;
  }

  get tileX() {
    return this.shadowRoot.querySelector('input[name="tile-x"]').value;
  }

  get tileY() {
    return this.shadowRoot.querySelector('input[name="tile-y"]').value;
  }

  get paletteCount() {
    return this.shadowRoot.querySelector('input[name="palette-count"]').value;
  }

  get paletteColorCount() {
    return this.shadowRoot.querySelector('input[name="palette-color-count"]').value;
  }

  create() {
    this.dispatchEvent(new CustomEvent('create', {
      detail: {
        size: {
          x: this.pixelsX,
          y: this.pixelsY
        },
        tile: {
          x: this.tileX,
          y: this.tileY
        },
        palette: {
          count: this.paletteCount,
          paletteColorCount: this.paletteColorCount
        }
      }
    }));
    this.remove();
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
        width: 500px;
        height: auto;
        transform: translate(-50%, -50%);

        background-color: #DDD;
        border: 1px solid #999;
        border-radius: 3px;
        box-shadow: 0 5px 5px -3px rgba(0,0,0,.2),
                    0 8px 10px 1px rgba(0,0,0,.14),
                    0 3px 14px 2px rgba(0,0,0,.12);
      }

      .title-bar {
        padding: 8px;
        padding-left: 16px;
        background-color: #CCC;
        border-bottom: 1px solid #aaa;
      }

      .title {
        font-size: 22px;
        font-weight: bold;
        color: #444;
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

      .choice-container {
        display: flex;
        flex-direction: row;
        padding: 24px;
      }

      .choice-1 {
        flex: 3;
        display: flex;
        flex-direction: column;
      }

      .choice-2 {
        flex: 2;
        display: flex;
        flex-direction: column;
      }

      .control-container {
        padding-bottom: 20px;
      }

      .control-container label {
        font-size: 17px;
        color: #666;
      }

      .control-container input {
        width: 40px;
      }

      .control-container span {
        color: #999;
        font-size: 11px;
        padding-right: 16px;
      }

      .controls {
        padding-top: 12px;
      }

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

      button:hover {
        cursor: pointer;
        background-color: #EEE;
      }
    `;
  }


  template() {
    return html`
      <div class="container">
        <div class="choice-container">
          <div class="choice-1">
            <span class="sub-title">Create</span>

            <div class="sub-header">Canvas size</div>
            <div class="control-container">
              <label for="pixels-x">x</label>
              <input name="pixels-x" type="number" value="160" >
              <span>px</span>
              <label for="pixels-x">y</label>
              <input name="pixels-y" type="number" value="144" >
              <span>px</span>
            </div>

            <div class="sub-header">Tile size</div>
            <div class="control-container">
              <label for="tile-x">x</label>
              <input name="tile-x" type="number" value="8" >
              <span>px</span>

              <label for="tile-y">y</label>
              <input name="tile-y" type="number" value="8" >
              <span>px</span>
            </div>

            <div class="sub-header">Palettes</div>
            <div class="control-container">
              <label for="palette-count">count </label>
              <input name="palette-count" type="number" value="1" >
              <br/>
              <label for="palette-color-count">colors</label>
              <input name="palette-color-count" type="number" value="8" >
              <span>per palette</span>
            </div>

            <div class="controls">
              <button id="create">create</button>
            </div>
          </div>
          <div class="choice-2">
            <span class="sub-title">Open</span>
            <div class="controls">
              <button>choose...</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
});
