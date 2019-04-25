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
    this.pixelInput.value = 8;
    this.bound_inputChange = this.inputChange.bind(this);
    this.bound_checkboxChange = this.checkboxChange.bind(this);
    this.pixelInput.addEventListener('change', this.bound_inputChange);
    this.checkbox.addEventListener('change', this.bound_checkboxChange);
  }

  disconnectedCallback() {
    this.pixelInput.removeEventListener('change', this.bound_inputChange);
    this.checkbox.removeEventListener('change', this.bound_checkboxChange);
  }

  get pixelInput() {
    return this.shadowRoot.querySelector('input[type="text"]');
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

  get pixels() {
    return this.pixels_;
  }

  set pixels(value) {
    this.pixels_ = value;
  }

  inputChange(e) {
    this.pixels = this.pixelInput.value;
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
        pixels: this.pixels
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

      #pixel-input {
        width: 20px;
        margin: 0;
        margin-left: 12px;
      }
    `;
  }


  template() {
    return html`
      <span>Grid</span>
      <input type="checkbox">
      <input type="text" id="pixel-input">
      <span>px</span>
    `;
  }
});
