const {
  customElements,
  HTMLElementExtended,
  html,
  css
} = require('@webformula/pax-core');

customElements.define('palette-tool', class extends HTMLElementExtended {
  constructor() {
    super();
    this.cloneTemplate();
  }

  connectedCallback() {
    this.bound_clickColor = this.clickColor.bind(this);
    this.bound_onColorChange = this.onColorChange.bind(this);
    this.shadowRoot.querySelector('.palette-container').addEventListener('click', this.bound_clickColor);
    this.shadowRoot.querySelector('color-picker').addEventListener('change', this.bound_onColorChange);
  }

  disconnectedCallback() {
    this.shadowRoot.querySelector('.palette-container').removeEventListener('click', this.bound_clickColor);
    this.shadowRoot.querySelector('color-picker').removeEventListener('change', this.bound_onColorChange);
  }

  static get observedAttributes() {
    return ['count', 'color-count'];
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === 'count') this.count = newValue;
    if (name === 'color-count') this.colorCount = newValue;
  }

  get count() {
    return this.count_ || 2;
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

  isEdit() {
    return this.shadowRoot.querySelector('input[name="edit"]').checked;
  }

  generateDefaultPalette() {
    const step = 255 / this.colorCount;
    return [...new Array(this.colorCount)].map((_, i) => {
      const value = parseInt(step * i);
      return [value, value, value, 1];
    });
  }

  updatePalette(arr) {
    if (arr.length > this.colorCount) [...new Array(arr.length - this.colorCount)].forEach(() => arr.pop());
    if (arr.length < this.colorCount) {
      const defaults = this.generateDefaultPalette();
      [...new Array(this.colorCount - arr.length)].forEach((_, i) => arr.push(defaults[(arr.length - 1) + i]));
    }
  }

  clickColor(e) {
    if (!e.target.classList.contains('color')) return;

    if (this.selected) this.selected.classList.remove('selected');
    this.selected = e.target;
    this.selected.classList.add('selected');
  }

  onColorChange(e) {
    if (this.isEdit()) this.updateSelected(e.detail.color);
  }

  updateSelected(color) {
    if (!this.selected) return;
    const location = this.selected.getAttribute('location').split('-');
    this.palettes[location[0]][location[1]] = color;
    this.selected.style.backgroundColor = this.convertArrToRBGA(color);
  }

  convertArrToRBGA(arr) {
    return `rgba(${arr.join(',')})`;
  }

  styles() {
    return css`
      .palette-container {
        width: 312px;
        background-color: white;
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
        ${[...new Array(this.count)].map((_, i) => `
          ${i !== 0 ? '<div class="divider"></div>' : ''}
          <div class="palette">
            ${[...new Array(this.colorCount)].map((_, j) => `
              <div class="color" style="background-color: ${this.convertArrToRBGA(this.palettes[i][j])};" location="${i}-${j}"></div>
            `).join('\n')}
          </div>

        `).join('\n')}

        <div class="spacer"></div>
        <color-picker></color-picker>
      </div>
    `;
  }
});
