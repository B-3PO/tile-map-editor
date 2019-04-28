const {
  customElements,
  HTMLElementExtended,
  html,
  css
} = require('@webformula/pax-core');

customElements.define('palette-display', class extends HTMLElementExtended {
  constructor() {
    super();
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
        min-width: 100px;
        height: 25px;
      }

      .color {
        flex: 1;
        height: 25px;
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
