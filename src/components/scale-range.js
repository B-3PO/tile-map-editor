const {
  customElements,
  HTMLElementExtended,
  html,
  css
} = require('@webformula/pax-core');

customElements.define('scale-range', class extends HTMLElementExtended {
  constructor() {
    super();
    this.cloneTemplate();
  }

  connectedCallback() {
    this.bound_inputChange = this.inputChange.bind(this);
    this.bound_rangeChange = this.rangeChange.bind(this);
    this.inputEl.addEventListener('change', this.bound_inputChange);
    this.rangeEl.addEventListener('input', this.bound_rangeChange);
    this.max = this.hasAttribute('max') ? this.getAttribute('max') : 10;
    this.min = this.hasAttribute('min') ? this.getAttribute('min') : 1;
    this.value = this.hasAttribute('value') ? this.getAttribute('value') : 1;
    this.inited = true;
  }

  disconnectedCallback() {
    this.inputEl.removeEventListener('change', this.bound_inputChange);
    this.rangeEl.removeEventListener('input', this.bound_rangeChange);
  }

  static get observedAttributes() {
    return ['min', 'max'];
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === 'min') this.min = newValue;
    if (name === 'maxt') this.max = newValue;
  }

  get min() {
    return this.min_;
  }

  set min(value) {
    value = parseInt(value);
    this.min_ = value;
  }

  get max() {
    return this.max_;
  }

  set max(value) {
    value = parseInt(value);
    this.max_ = value;
  }

  get inputEl() {
    return this.shadowRoot.querySelector('input[type="text"]');
  }

  get rangeEl() {
    return this.shadowRoot.querySelector('input[type="range"]');
  }

  get value() {
    return this.value_;
  }

  set value(v) {
    this.value_ = parseInt(v);
    if (this.value_ < this.min) this.value_ = this.min;
    if (this.value_ > this.max) this.value_ = this.max;

    this.rangeEl.removeEventListener('input', this.bound_inputChange);
    this.inputEl.removeEventListener('change', this.bound_inputChange);
    this.rangeEl.value = this.value_;
    this.inputEl.value = this.value_;
    this.rangeEl.addEventListener('input', this.bound_inputChange);
    this.inputEl.addEventListener('change', this.bound_inputChange);
    if (this.inited) this.handleChange();
  }

  inputChange(e) {
    this.value = this.inputEl.value;
  }

  rangeChange(e) {
    this.value = this.rangeEl.value;
  }

  handleChange() {
    this.dispatchEvent(new CustomEvent('change', {
      detail: {
        value: this.value
      }
    }));
  }

  styles() {
    return css`
      :host {
        display: block;
        width: 180px;
        background-color: #DDD;
        border: 1px solid #AAA;
        border-radius: 3px;
        padding: 2px;
      }

      #scale-input {
        width: 20px;
        margin: 0;
      }

      #scale-range {
        width: 120px;
        height: 9px;
        padding-left: 4px;
      }
    `;
  }


  template() {
    return html`
      <span>%</span>
      <input type="text" id="scale-input">
      <input type="range" min="1" max="10" value="${this.value}" id="scale-range">
    `;
  }
});
