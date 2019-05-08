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
    this.leftColor_ = '#000000';
    this.rightColor_ = '#FFFFFF';
    this.cloneTemplate();
    this.selectedPalette = 0;
  }

  connectedCallback() {
    this.debounced_dispatchPaletteChange = Utils.debounce(this.dispatchPaletteChange.bind(this), 100);
    this.bound_clickColor = this.clickColor.bind(this);
    this.bound_onColorChange = this.onColorChange.bind(this);
    this.bound_onPaletteClick = this.onPaletteClick.bind(this);
    this.bound_onContextMenu = this.onContextMenu.bind(this);
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
    this.shadowRoot.querySelector('.palette-container').addEventListener('click', this.bound_clickColor);
    this.shadowRoot.querySelector('color-picker').addEventListener('change', this.bound_onColorChange);
    this.shadowRoot.querySelector('color-picker').addEventListener('change', this.bound_onColorChange);
    this.shadowRoot.querySelector('#palettes').addEventListener('contextmenu', this.bound_onContextMenu);
    this.shadowRoot.querySelector('#palettes').addEventListener('click', this.bound_onPaletteClick);
  }

  removeEvents() {
    this.shadowRoot.querySelector('.palette-container').removeEventListener('click', this.bound_clickColor);
    this.shadowRoot.querySelector('color-picker').removeEventListener('change', this.bound_onColorChange);
    this.shadowRoot.querySelector('#palettes').removeEventListener('contextmenu', this.bound_onContextMenu);
    this.shadowRoot.querySelector('#palettes').removeEventListener('click', this.bound_onPaletteClick);
  }

  static get observedAttributes() {
    return ['count', 'color-count'];
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === 'count') this.count = newValue;
    if (name === 'color-count') this.colorCount = newValue;
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
    if (this.palettes_.length < this.colorCount) {
      this.palettes_ = this.palettes_.concat([...new Array(this.colorCount - this.palettes_.length)].map(() => this.generateDefaultPalette()));
      change = true;
    }
    if (this.palettes_.length > this.colorCount) {
      [...new Array(this.palettes_.length - this.colorCount)].forEach(() => this.palettes_.pop());
      change = true;
    }
    if (change) this.palettes_.forEach(p => this.updatePalette(p));
    return this.palettes_;
  }

  get selected() {
    return this.selected_;
  }

  set selected(value) {
    if (!value.classList.contains('color')) throw Error('requires color element');
    this.selected_ = value;
  }

  get selectedColor() {
    if (!this.selected) return null;
    const location = this.selectedLocation;
    return this.palettes[location[0]][location[1]];
  }

  get selectedLocation() {
    if (!this.selected) return null;
    return this.selected.getAttribute('location').split('-');
  }

  get colorPicker() {
    return this.shadowRoot.querySelector('color-picker');
  }

  get selectedPalette() {
    return this.selectedPalette_;
  }

  set selectedPalette(value) {
    value = parseInt(value);
    if (value > this.count) value = this.count;
    this.selectedPalette_ = value;
  }


  get leftColor() {
    return this.leftColor_;
  }

  set leftColor(value) {
    this.leftColor_ = value;
    this.shadowRoot.querySelector('#left-color').style.backgroundColor = value;
  }

  get rightColor() {
    return this.rightColor_;
  }

  set rightColor(value) {
    this.rightColor_ = value;
    this.shadowRoot.querySelector('#right-color').style.backgroundColor = value;
  }

  isEdit() {
    return this.shadowRoot.querySelector('input[name="edit"]').checked;
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

  onContextMenu(e) {
    e.preventDefault();
    this.clickColor(e);
    setTimeout(() => {
      this.rightColor = this.convertArrToRBGA(this.selectedColor);
    }, 0);
  }

  onPaletteClick(e) {
    setTimeout(() => {
      if (e.which === 1) this.leftColor = this.convertArrToRBGA(this.selectedColor);
    }, 0);
  }

  clickColor(e) {
    this.selectPalette(e);
    if (!e.target.classList.contains('color')) {
      this.dispatchChange();
      return;
    }

    if (this.selected) this.selected.classList.remove('selected');
    this.selected = e.target;
    this.selected.classList.add('selected');
    this.dispatchChange();
  }

  onColorChange(e) {
    if (this.isEdit()) this.updateSelected(e.detail.color);
    this.dispatchChange();
  }

  selectPalette(e) {
    if (!e.target.classList.contains('palette-select')) return;
    [...this.shadowRoot.querySelectorAll('.palette-select')].forEach(el => el.checked = false);
    e.target.checked = true;
    this.selectedPalette = parseInt(e.target.getAttribute('id').replace('palette-', ''));
  }

  updateSelected(color) {
    if (!this.selected) return;
    const location = this.selectedLocation;
    this.palettes[location[0]][location[1]] = color;
    this.selected.style.backgroundColor = this.convertArrToRBGA(color);
    this.debounced_dispatchPaletteChange();
  }

  convertArrToRBGA(arr) {
    return `rgba(${arr.join(',')})`;
  }

  dispatchChange() {
    this.dispatchEvent(new CustomEvent('change', {
      detail: {
        selectedPalette: this.selectedPalette,
        selectedColor: this.selectedColor,
        pickerColor: this.colorPicker.color,
        palettes: this.palettes
      }
    }));
  }

  dispatchPaletteChange() {
    this.dispatchEvent(new CustomEvent('paletteChange', {
      detail: {
        selectedPalette: this.selectedPalette,
        selectedColor: this.selectedColor,
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
        border: 3px solid rgb(0, 159, 218, 0.7);
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
        margin-left: 32px;
        font-size: 18px;
        font-weight: 400;
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
    `;
  }

  template() {
    return html`
      <div class="palette-container">
        <div class="top-row">
          <div class="title">Palettes</div>
          <input type="checkbox" name="edit">
          <label class="edit-label" for="edit">Edit</label>
        </div>

        <div id="palettes">
        ${[...new Array(this.count)].map((_, i) => `
          ${i !== 0 ? '<div class="divider"></div>' : ''}
          <div class="palette">
            <input type="checkbox" ${i === 0 ? 'checked' : ''} id="palette-${i}" class="palette-select">
            ${[...new Array(this.colorCount)].map((_, j) => `
              <div class="color" style="background-color: ${this.convertArrToRBGA(this.palettes[i][j])};" location="${i}-${j}"></div>
            `).join('\n')}
          </div>

        `).join('\n')}
        </div>

        <div class="spacer"></div>
        <color-picker></color-picker>
        <div class="row">
          <div id="left-color" class="color-block" style="background-color: ${this.leftColor};"></div>
          <div id="right-color" class="color-block" style="background-color: ${this.rightColor};"></div>
        </div>
      </div>
    `;
  }
});
