const {
  customElements,
  HTMLElementExtended,
  html,
  css
} = require('@webformula/pax-core');

customElements.define('palette-display', class extends HTMLElementExtended {
  constructor() {
    super();
    this.width = this.getAttribute('color-width') || 80;
    this.colorWidth = this.getAttribute('color-width') || 20;
    this.cloneTemplate();
  }

  get colors() {
    return this.colors_ || [];
  }

  set colors(value) {
    this.colors_ = value;
    this.render();
  }

  styles() {
    return css`
      .container {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        width: ${this.width}px;
      }

      .color {
        width: ${this.colorWidth}px;
        height: 20px;
      }
    `;
  }

  template() {
    return html`
      <div class="container">
      ${this.colors.map(rgba => html`
        <div class="color" style="background-color: rgba(${rgba.join(',')})"></div>
      `).join('\n')}
      </div>
    `;
  }
});
