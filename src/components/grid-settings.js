const {
  customElements,
  HTMLElementExtended,
  html,
  css
} = require('@webformula/pax-core');

customElements.define('grid-settings', class extends HTMLElementExtended {
  constructor() {
    super();
    this.cloneTemplate();
  }

  connectedCallback() {
    this.valueX = 8;
    this.valueY = 8;
    this.bound_inputXChange = this.inputXChange.bind(this);
    this.bound_inputYChange = this.inputYChange.bind(this);
    this.bound_checkboxChange = this.checkboxChange.bind(this);
    this.inputX.addEventListener('change', this.bound_inputXChange);
    this.inputY.addEventListener('change', this.bound_inputYChange);
    this.checkbox.addEventListener('change', this.bound_checkboxChange);
  }

  disconnectedCallback() {
    this.inputX.removeEventListener('change', this.bound_inputXChange);
    this.inputY.removeEventListener('change', this.bound_inputYChange);
    this.checkbox.removeEventListener('change', this.bound_checkboxChange);
  }

  get inputX() {
    return this.shadowRoot.querySelector('#input-x');
  }

  get inputY() {
    return this.shadowRoot.querySelector('#input-y');
  }

  get checkbox() {
    return this.shadowRoot.querySelector('input[type="checkbox"]');
  }

  get show() {
    return this.show_;
  }

  set show(value) {
    this.show_ = value;
  }

  get valueX() {
    return this.valueX_;
  }

  set valueX(value) {
    this.valueX_ = value;
    this.inputX.value = value;
  }

  get valueY() {
    return this.valueY_;
  }

  set valueY(value) {
    this.valueY_ = value;
    this.inputY.value = value;
  }

  inputXChange(e) {
    this.valueX = this.inputX.value;
    this.handleChange();
  }

  inputYChange(e) {
    this.valueY = this.inputY.value;
    this.handleChange();
  }

  checkboxChange(e) {
    this.show = this.checkbox.checked;
    this.handleChange();
  }

  handleChange() {
    this.dispatchEvent(new CustomEvent('change', {
      detail: {
        show: this.show,
        valueX: this.valueX,
        valueY: this.valueY
      }
    }));
  }

  styles() {
    return css`
      :host {
        display: block;
        background-color: #DDD;
        border: 1px solid #AAA;
        border-radius: 3px;
        padding: 2px;
        padding-right: 8px;
      }

      .pixel-input {
        width: 20px;
        margin: 0;
      }

      span {
        font-size: 11px;
        color: #666;
      }

      label {
        font-size: 13px;
        color: #444;
      }
    `;
  }


  template() {
    return html`
      <span>Grid</span>
      <input type="checkbox">
      <label>X</label>
      <input type="text" class="pixel-input" id="input-x">
      <span>px</span>
      <label>Y</label>
      <input type="text" class="pixel-input" id="input-y">
      <span>px</span>
    `;
  }
});
