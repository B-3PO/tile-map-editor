const {
  customElements,
  HTMLElementExtended,
  html,
  css
} = require('@webformula/pax-core');

customElements.define('save-palettes-dialog', class extends HTMLElementExtended {
  constructor() {
    super();
    this.cloneTemplate(true);
  }

  connectedCallback() {
    this.bound_save = this.save.bind(this);
    this.saveButton.addEventListener('click', this.bound_save);
  }

  disconnectedCallback() {
    this.saveButton.removeEventListener('click', this.bound_save);
  }

  get saveButton() {
    return this.shadowRoot.querySelector('#save-button');
  }

  get paletteTool() {
    return document.querySelector('palette-tool');
  }

  get palettes() {
    return this.paletteTool.palettes || [];
  }

  save() {
    this.dispatchEvent(new CustomEvent('save', {
      detail: {
        label: this.shadowRoot.querySelector('input[name="label"]').value,
        palettes: this.palettes
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

      .controls {
        margin-top: 24px;
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

      .palette {
        display: flex;
        flex-direction: row;
      }

      .color {
        flex: 1;
        height: 24px;
        border: 3px solid rgba(0,0,0,0);
        box-sizing: border-box;
      }

      label {
        padding-right: 4px;
      }

      input {
        width: 80px;
      }
    `;
  }


  template() {
    return html`
      <div class="container">
        <div class="content">
          <div class="title">Save</div>

          <div class="row">
            <label for="label">Label:</label>
            <input name="label">
          </div>

          <br/>

          <div class="column">
            ${this.palettes.map((p, i) => html`
              <div class="palette">
                ${p.map((c, j) => html`<div class="color" style="background-color: ${ColorUtils.ArrayToRBGA(p[j])};" id="settings-color:${i}-${j}"></div>`).join('\n')}
              </div>
            `)}
          </div>

          <br/>

          <div class="controls">
            <button id="save-button">save</button>
          </div>
        </div>
      </div>
    `;
  }
});
