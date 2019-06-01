const {
  customElements,
  HTMLElementExtended,
  html,
  css
} = require('@webformula/pax-core');
const Settings = require('../global/Settings.js');
// const Utils = require('../global/utils.js');
// const ColorUtils = require('../global/ColorUtils.js');

customElements.define('settings-tool', class extends HTMLElementExtended {
  constructor() {
    super();
    this.settings = new Settings();
    this.bound_saveCurrentPalettes = this.saveCurrentPalettes.bind(this);
    this.bound_clearPalette = this.clearPalette.bind(this);
    this.bound_loadPalette = this.loadPalette.bind(this);
    this.cloneTemplate(true);
  }

  connectedCallback() {
    this.addEvents();
  }

  disconnectedCallback() {
    this.removeEvents();
  }

  addEvents() {
    this.shadowRoot.querySelector('#save-current-palette-button').addEventListener('click', this.bound_saveCurrentPalettes);
    [...this.shadowRoot.querySelectorAll('.clear-palette-button')].forEach(el => el.addEventListener('click', this.bound_clearPalette));
    [...this.shadowRoot.querySelectorAll('.load-palette-button')].forEach(el => el.addEventListener('click', this.bound_loadPalette));

  }

  removeEvents() {
    this.shadowRoot.querySelector('#save-current-palette-button').removeEventListener('click', this.bound_saveCurrentPalettes);
    [...this.shadowRoot.querySelectorAll('.clear-palette-button')].forEach(el => el.removeEventListener('click', this.bound_clearPalette));
    [...this.shadowRoot.querySelectorAll('.load-palette-button')].forEach(el => el.removeEventListener('click', this.bound_loadPalette));
  }

  get paletteTool() {
    return document.querySelector('palette-tool');
  }

  saveCurrentPalettes() {
    document.body.insertAdjacentHTML('beforeend', '<save-palettes-dialog></save-palettes-dialog>');
    document.querySelector('save-palettes-dialog').addEventListener('save', ({ detail: { label, palettes } }) => {
      this.settings.savePalettes({ label, palettes });
      this.render();
    });
  }

  clearPalette({ target }) {
    this.settings.removePalette(target.getAttribute('group-id'));
    this.render();
  }

  loadPalette({ target }) {
    this.settings.getPaletteGroup(target.getAttribute('group-id')).palettes.forEach((palette, i) => {
      this.paletteTool.setPalette(i, palette);
    });
  }

  styles() {
    return css`
      :host {
        display: block;
      }

      .divider {
        border-bottom: 1px solid #999;
      }

      .spacer {
        padding-top: 12px;
      }

      .top-row {
        display: flex;
        align-items: center;
      }

      .title {
        font-size: 18px;
        font-weight: 400;
        padding-left: 6px;
        flex: 1;
      }

      .subtitle {
        font-size: 14px;
        padding-left: 6px;
        flex: 1;
      }

      .row {
        display: flex;
        flex-direction: row;
      }

      .settings {
        margin: 18px 0;
      }

      .settings .sub {
        margin-top: 6px;
        margin-left: 12px;
      }

      .setting-input {
        width: 40px;
        margin-right: 22px;
      }

      .palette-container {
        width: 312px;
        margin: 6px;
      }

      .palette {
        display: flex;
        flex-direction: row;
        padding: 6px;
      }

      .palette label {
        font-size: 14px;
        font-weight: bold;
        color: #666;
        padding-right: 12px;
      }

      .palette button {
        margin-left: 6px;
      }

      .color {
        flex: 1;
        height: 24px;
        border: 3px solid rgba(0,0,0,0);
        box-sizing: border-box;
      }
    `;
  }

  template() {
    return html`
      <div class="palette-container">
        <div class="top-row">
          <div class="title">Settings</div>
        </div>

        <div class="row">
          <button id="save-current-palette-button">Save current palettes</button>
        </div>

        <div class="settings">
          <div class="subtitle">Saved Palettes</div>

          <div class="sub">
            ${this.settings.palettes.map(({id, label, palettes}) => html`
              <div class="palette-group">
                <div class="row" style="padding: 8px;">
                  <label style="flex: 1;">${label}</label>
                  <button class="clear-palette-button" style="margin-right: 8px;" group-id="${id}">clear</button>
                  <button class="load-palette-button" group-id="${id}">load</button>
                </div>
                ${palettes.map(palette => html`
                  <div class="palette">
                    ${palette.map(c => html`<div class="color" style="background-color: ${ColorUtils.ArrayToRBGA(c)};"></div>`).join('\n')}
                  </div>
                `).join('\n')}
              </div>
            `).join('\n')}
          </div>
        </div>
      </div>
    `;
  }
});
