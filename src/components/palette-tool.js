const {
  customElements,
  HTMLElementExtended,
  html,
  css
} = require('@webformula/pax-core');
const Utils = require('../global/utils');

customElements.define('palette-tool', class extends HTMLElementExtended {
  constructor() {
    super();

    this.selectedColorLocation = [0, 3];
    this.selectedAltColorLocation = [0, 0];

    this.cloneTemplate();
  }

  connectedCallback() {
    this.debounced_dispatchPaletteChange = Utils.debounce(this.dispatchPaletteChange.bind(this), 100);
    this.bound_clickPaletteColor = this.clickPaletteColor.bind(this);
    this.bound_rightClickPaletteColor = this.rightClickPaletteColor.bind(this);
    this.bound_onColorChange = this.onColorChange.bind(this);
    this.bound_onContextMenu = this.onContextMenu.bind(this);
    this.bound_onEditCheck = this.onEditCheck.bind(this);
    this.bound_onSettingsChange = this.onSettingsChange.bind(this);
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
    this.shadowRoot.querySelector('.palette-container').addEventListener('click', this.bound_clickPaletteColor);
    this.shadowRoot.querySelector('.palette-container').addEventListener('contextmenu', this.bound_rightClickPaletteColor);
    this.shadowRoot.querySelector('color-picker').addEventListener('change', this.bound_onColorChange);
    this.shadowRoot.querySelector('#palettes').addEventListener('contextmenu', this.bound_onContextMenu);
    this.shadowRoot.querySelector('input[type=checkbox]').addEventListener('change', this.bound_onEditCheck);
    this.shadowRoot.querySelector('input[name=count]').addEventListener('change', this.bound_onSettingsChange);
    this.shadowRoot.querySelector('input[name=colorCount]').addEventListener('change', this.bound_onSettingsChange);
  }

  removeEvents() {
    this.shadowRoot.querySelector('.palette-container').removeEventListener('click', this.bound_clickPaletteColor);
    this.shadowRoot.querySelector('.palette-container').removeEventListener('contextmenu', this.bound_rightClickPaletteColor);
    this.shadowRoot.querySelector('color-picker').removeEventListener('change', this.bound_onColorChange);
    this.shadowRoot.querySelector('#palettes').removeEventListener('contextmenu', this.bound_onContextMenu);
    this.shadowRoot.querySelector('input[type=checkbox]').removeEventListener('change', this.bound_onEditCheck);
    this.shadowRoot.querySelector('input[name=count]').removeEventListener('change', this.bound_onSettingsChange);
    this.shadowRoot.querySelector('input[name=colorCount]').removeEventListener('change', this.bound_onSettingsChange);
  }

  static get observedAttributes() {
    return ['count', 'color-count'];
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === 'count') this.count = newValue;
    if (name === 'color-count') this.colorCount = newValue;
  }

  get selectedColorElement() {
    return this.shadowRoot.querySelector('.color.selected');
  }

  get selectedAltColorElement() {
    return this.shadowRoot.querySelector('.color.selected-alt');
  }

  get count() {
    return this.count_ || 1;
  }

  set count(value) {
    value = parseInt(value);
    if (value < 1) value = 1;
    this.count_ = value;
    this.render();
  }

  get colorCount() {
    return this.colorCount_ || 4;
  }

  // TODO regenrate color if the colorCount increases
  set colorCount(value) {
    value = parseInt(value);
    if (value < 1) value = 1;
    this.colorCount_ = value;
    this.render();
  }

  get palettes() {
    let change = false;
    if (!this.palettes_) this.palettes_ = [...new Array(this.count)].map(() => this.generateDefaultPalette());
    if (this.palettes_.length < this.count) {
      this.palettes_ = this.palettes_.concat([...new Array(this.count - this.palettes_.length)].map(() => this.generateDefaultPalette()));
      change = true;
    }
    if (this.palettes_.length > this.count) {
      [...new Array(this.palettes_.length - this.count)].forEach(() => this.palettes_.pop());
      change = true;
    }
    if (change) this.palettes_.forEach(p => this.updatePalette(p));
    return this.palettes_;
  }

  get colorPicker() {
    return this.shadowRoot.querySelector('color-picker');
  }

  get color() {
    return this.convertArrToRBGA(this.palettes[this.selectedColorLocation[0]][this.selectedColorLocation[1]]);
  }

  set color(colorArr) {
    if (!this.isEdit) return;
    this.updateSelected(colorArr);
  }

  get rawColor() {
    return this.palettes[this.selectedColorLocation[0]][this.selectedColorLocation[1]];
  }

  get altColor() {
    return this.convertArrToRBGA(this.palettes[this.selectedAltColorLocation[0]][this.selectedAltColorLocation[1]]);
  }

  get rawAltColor() {
    return this.palettes[this.selectedAltColorLocation[0]][this.selectedAltColorLocation[1]];
  }

  get isEdit() {
    return this.isEdit_ || false;
  }

  set isEdit(value) {
    this.isEdit_ = value;
  }

  onSettingsChange() {
    this.count = this.shadowRoot.querySelector('input[name=count]').value;
    this.colorCount = this.shadowRoot.querySelector('input[name=colorCount]').value;
  }

  onEditCheck(e) {
    this.isEdit = this.shadowRoot.querySelector('input[name="edit"]').checked;
  }

  generateDefaultPalette() {
    const step = 255 / this.colorCount;
    return [...new Array(this.colorCount)].map((_, i) => {
      const value = parseInt(step * i);
      if (i === this.colorCount - 1) return [255, 255, 255, 1];
      return [value, value, value, 1];
    }).reverse();
  }

  updatePalette(arr) {
    if (arr.length > this.colorCount) [...new Array(arr.length - this.colorCount)].forEach(() => arr.pop());
    if (arr.length < this.colorCount) {
      const defaults = this.generateDefaultPalette();
      [...new Array(this.colorCount - arr.length)].forEach((_, i) => arr.push(defaults[(arr.length - 1) + i]));
    }
  }

  setPalette(paletteId, palette) {
    const palettes = this.palettes;
    palettes[paletteId] = palette;
    palette.forEach((c, i) => {
      const el = this.shadowRoot.querySelector(`[id="${paletteId}:${i}"]`);
      el.style.backgroundColor = this.convertArrToRBGA(c);
    });
    this.debounced_dispatchPaletteChange();
  }

  convertArrToRBGA(arr) {
    return `rgba(${arr.join(',')})`;
  }

  // select color
  clickPaletteColor(e) {
    // not clickomng on color block
    if (!e.target.classList.contains('color')) {
      // NOTE is this needed
      // this.dispatchChange();
      return;
    }

    // clear last selected color inside palette
    if (this.selectedColorElement) this.selectedColorElement.classList.remove('selected');

    // select new palette color
    e.target.classList.add('selected');
    this.selectedColorLocation = this.selectedColorElement.getAttribute('id').split(':').map(n => parseInt(n));
    this.render();
    this.dispatchChange();
    this.colorPicker.color = this.palettes[this.selectedColorLocation[0]][this.selectedColorLocation[1]];
  }

  // select alt color
  rightClickPaletteColor(e) {
    e.preventDefault();

    // not clickomng on color block
    if (!e.target.classList.contains('color')) {
      // NOTE is this needed
      // this.dispatchChange();
      return;
    }

    // clear last selected color inside palette
    if (this.selectedAltColorElement) this.selectedAltColorElement.classList.remove('selected-alt');

    // select new palette color
    e.target.classList.add('selected-alt');
    this.selectedAltColorLocation = this.selectedAltColorElement.getAttribute('id').split(':').map(n => parseInt(n));
    this.render();
    this.dispatchChange();
  }

  onColorChange(e) {
    if (this.isEdit) this.updateSelected(e.detail.color);
    this.dispatchChange();
  }

  updateSelected(color) {
    this.palettes[this.selectedColorLocation[0]][this.selectedColorLocation[1]] = color;
    this.selectedColorElement.style.backgroundColor = this.convertArrToRBGA(color);
    this.shadowRoot.querySelector('#left-color').style.backgroundColor = this.convertArrToRBGA(color);
    this.debounced_dispatchPaletteChange();
  }

  // prevent context menu from showing
  onContextMenu(e) {
    e.preventDefault();
  }

  isSelectedColor(i, j) {
    return this.selectedColorLocation[0] === i && this.selectedColorLocation[1] === j;
  }

  isSelectedAltColor(i, j) {
    return this.selectedAltColorLocation[0] === i && this.selectedAltColorLocation[1] === j;
  }

  dispatchChange() {
    this.dispatchEvent(new CustomEvent('change', {
      detail: {
        selectedPalette: this.selectedPalette,
        selectedColor: this.rawColor,
        altColor: this.rawAltColor,
        pickerColor: this.colorPicker.color,
        palettes: this.palettes
      }
    }));
  }

  dispatchPaletteChange() {
    this.dispatchEvent(new CustomEvent('paletteChange', {
      detail: {
        selectedPalette: this.selectedPalette,
        selectedColor: this.rawColor,
        altColor: this.rawAltColor,
        pickerColor: this.colorPicker.color,
        palettes: this.palettes
      }
    }));
  }

  styles() {
    return css`
      :host {
        display: block;
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

      .color {
        flex: 1;
        height: 24px;
        border: 3px solid rgba(0,0,0,0);
        box-sizing: border-box;
      }

      .color:hover {
        border: 3px solid #AAA;
      }

      .color.selected {
        border: 3px solid rgb(0, 159, 218);
      }

      .color.selected-alt {
        border: 3px solid rgb(192, 168, 242);
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

      .edit-label {
        color: #666;
        font-size: 14px;
        font-weight: bold;
        padding-right: 6px;
      }

      .palette-select {
        margin-left: 8px;
        margin-right: 12px;
      }

      .row {
        display: flex;
        flex-direction: row;
      }

      .color-block {
        flex: 1;
        height: 24px;
        margin: 8px 5px;
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
    `;
  }

  template() {
    return html`
      <div class="palette-container">
        <div class="top-row">
          <div class="title">Palettes</div>
          <input type="checkbox" name="edit" ${this.isEdit ? 'checked' : ''}>
          <label class="edit-label" for="edit">Edit</label>
        </div>

        <div class="settings">
          <div class="subtitle">Settings</div>

          <div class="sub">
            <label class="edit-label" for="count">Count</label>
            <input name="count" class="setting-input" value="${this.count}">
            <label class="edit-label" for="colorCount">Color count</label>
            <input name="colorCount" class="setting-input" value="${this.colorCount}">
          </div>
        </div>

        <div id="palettes">
        ${[...new Array(this.count)].map((_, i) => `
          ${i !== 0 ? '<div class="divider"></div>' : ''}
          <div class="palette">
            ${[...new Array(this.colorCount)].map((_, j) => `
              <div class="color ${this.isSelectedColor(i, j) ? 'selected' : ''} ${this.isSelectedAltColor(i, j) ? 'selected-alt' : ''}" style="background-color: ${this.convertArrToRBGA(this.palettes[i][j])};" id="${i}:${j}"></div>
            `).join('\n')}
          </div>
        `).join('\n')}
        </div>

        <div class="spacer"></div>
        <color-picker></color-picker>
        <div class="row">
          <div id="left-color" class="color-block" style="background-color: ${this.convertArrToRBGA(this.palettes[this.selectedColorLocation[0]][this.selectedColorLocation[1]])};"></div>
          <div id="right-color" class="color-block" style="background-color: ${this.convertArrToRBGA(this.palettes[this.selectedAltColorLocation[0]][this.selectedAltColorLocation[1]])};"></div>
        </div>
      </div>
    `;
  }
});
