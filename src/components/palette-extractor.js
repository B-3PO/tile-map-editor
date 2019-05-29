const {
  customElements,
  HTMLElementExtended,
  html,
  css
} = require('@webformula/pax-core');
const CanvasUtils = require('../global/CanvasUtils.js');

customElements.define('palette-extractor', class extends HTMLElementExtended {
  constructor() {
    super();
    this.colors = [];
    this.palettes = [];
    this.bound_ok = this.ok.bind(this);
    this.bound_cancel = this.cancel.bind(this);
    this.bound_mouseDown = this.mouseDown.bind(this);
    this.bound_mouseUp = this.mouseUp.bind(this);
    this.bound_mouseMove = this.mouseMove.bind(this);
    this.bound_mouseOver = this.mouseOver.bind(this);
    this.bound_mouseOut = this.mouseOut.bind(this);
    this.bound_paletteColorClock = this.paletteColorClick.bind(this);
    this.cloneTemplate();
  }

  connectedCallback() {
    this.canvasUtils = new CanvasUtils();
    this.colors = this.canvasUtils.canvasColors().reverse();
    this.palettes = this.canvasUtils.palettes;
    this.render();
  }

  disconnectedCallback() {
    this.removeEvents();
  }

  afterRender() {
    this.addEvents();
  }

  beforeRender() {
    this.removeEvents();
  }

  addEvents() {
    this.shadowRoot.addEventListener('mousedown', this.bound_mouseDown);
    this.shadowRoot.querySelector('#ok').addEventListener('click', this.bound_ok);
    this.shadowRoot.querySelector('#cancel').addEventListener('click', this.bound_cancel);
    this.shadowRoot.addEventListener('click', this.bound_paletteColorClock);
  }

  removeEvents() {
    this.shadowRoot.removeEventListener('mousedown', this.bound_mouseDown);
    document.removeEventListener('mouseup', this.bound_mouseUp);
    document.removeEventListener('mousemove', this.bound_mouseMove);
    this.shadowRoot.querySelector('#ok').removeEventListener('click', this.bound_ok);
    this.shadowRoot.querySelector('#cancel').removeEventListener('click', this.bound_cancel);
    this.shadowRoot.querySelectorAll('[container-location]').forEach(el => {
      el.removeEventListener('mouseenter', this.bound_mouseOver);
      el.removeEventListener('mouseleave', this.bound_mouseOut);
    });
    this.shadowRoot.removeEventListener('click', this.bound_paletteColorClock);
  }

  paletteColorClick(e) {
    if (this.allowColorSelect && e.target.classList.contains('color-block')) {
      this.slectedPalleteColor.style.backgroundColor = e.target.style.backgroundColor;
    }

    if (this.slectedPalleteColor) {
      this.slectedPalleteColor.classList.remove('palette-color-selected');
      this.slectedPalleteColor = undefined;
      this.allowColorSelect = false;
    } else if (e.target.classList.contains('palette-color')) {
      e.target.classList.add('palette-color-selected');
      this.slectedPalleteColor = e.target;
      this.allowColorSelect = true;
    }
  }

  mouseDown(e) {
    if (e.target.hasAttribute('is-picked') && e.target.getAttribute('is-picked') === 'false') {
      document.addEventListener('mouseup', this.bound_mouseUp);
      document.addEventListener('mousemove', this.bound_mouseMove);
      this.shadowRoot.querySelectorAll('[container-location]').forEach(el => {
        el.addEventListener('mouseenter', this.bound_mouseOver);
        el.addEventListener('mouseleave', this.bound_mouseOut);
      });
      this.currentLocationContainerElement = undefined;
      const { left, top} = this.shadowRoot.querySelector('.container').getBoundingClientRect();
      const el = this.shadowRoot.querySelector('#floating-color-block');
      el.setAttribute('color-id', e.target.getAttribute('color-id'));
      el.style.backgroundColor = e.target.style.backgroundColor;
      el.style.left = `${e.clientX - left}px`;
      el.style.top = `${e.clientY - top}px`;
      el.style.opacity = '1';
    }
  }

  mouseUp(e) {
    this.shadowRoot.querySelectorAll('[container-location]').forEach(el => {
      el.removeEventListener('mouseenter', this.bound_mouseOver);
      el.removeEventListener('mouseleave', this.bound_mouseOut);
    });
    document.removeEventListener('mouseup', this.bound_mouseUp);
    document.removeEventListener('mousemove', this.bound_mouseMove);
    const el = this.shadowRoot.querySelector('#floating-color-block');
    el.style.opacity = '0';

    if (this.currentLocationContainerElement) this.injectColorIntoContainer(this.currentLocationContainerElement, el.style.backgroundColor, el.getAttribute('color-id'));
  }

  mouseMove(e) {
    const { left, top} = this.shadowRoot.querySelector('.container').getBoundingClientRect();
    const el = this.shadowRoot.querySelector('#floating-color-block');
    el.style.left = `${e.clientX - left}px`;
    el.style.top = `${e.clientY - top}px`;
  }

  mouseOver(e) {
    this.currentLocationContainerElement = e.target;
  }

  mouseOut(e) {
    if (e.target === this.currentLocationContainerElement) this.currentLocationContainerElement = undefined;
  }

  injectColorIntoContainer(el, color, id) {
    el.insertAdjacentHTML('afterBegin', `<div class="color-block" style="background-color: ${color}" color-id="${id}"></div>`);
    this.shadowRoot.querySelector(`[color-id="${id}"][is-picked="false"]`).setAttribute('is-picked', 'true');
  }

  ok() {
    this.dispatchChange();
    this.remove();
  }

  cancel() {
    this.remove();
  }

  dispatchChange() {
    const colorsPerPallet = 4; // TODO hook this up
    const p = [...this.shadowRoot.querySelectorAll('.palette-color')].map(el => el.style.backgroundColor);
    let palettes = [...new Array(p.length / colorsPerPallet)].map(_ => []);
    const length = p.length;
    let i = 0;
    for (; i < length; i += 1) {
      palettes[Math.floor(i / colorsPerPallet)].push(p[i]);
    }
    const containers = [...this.shadowRoot.querySelectorAll('[container-location]')].reduce((a, b) => {
      const l = b.getAttribute('container-location').split('-');
      if (!a[l[0]]) a[l[0]] = [];
      a[l[0]][l[1]] = [...b.children].map(el => el.style.backgroundColor);
      return a;
    }, []);
    const colorMap = [...new Array(p.length / colorsPerPallet)].map(_ => ({}));
    colorMap.forEach((obj, i) => {
      palettes[i].reduce((a, b, j) => {
        a[b] = containers[i][j];
        return a;
      }, obj)
    });
    
    this.dispatchEvent(new CustomEvent('change', {
      detail: {
        palettes,
        colorMap
      }
    }));
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

      .title + .sub-header {
        margin-top: -28px;
        margin-bottom: 28px;
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

      .wrap {
        flex-wrap: wrap;
      }

      .controls {
        margin-top: 24px;
      }

      .button,
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

      .button:hover,
      button:hover {
        cursor: pointer;
        background-color: #EEE;
      }

      #ok,
      #all {
        margin-right: 6px;
      }

      .colors-container {
        margin-left: 22px;
      }

      .color-block {
        width: 24px;
        height: 24px;
        border: 2px solid rgba(53, 133, 185, 0);
      }

      .color-block[is-picked="true"] {
        opacity: 0;
      }

      .floating-color-block {
        position: fixed;
        top: 0;
        left: 0;
        opacity: 0;
        user-select: none;
        pointer-events: none;
        width: 24px;
        height: 24px;
        border: 2px solid rgba(53, 133, 185, 0);
      }

      .column.spaced-end {
        align-items: flex-end;
        justify-content: space-between;
      }

      .palette-container {
        display: flex;
        flex: 1;
        margin-left: 24px;
        border-left: 1px solid #666;
      }

      .horizontal-divider {
        width: 100%;
        border-bottom: 2px solid #999;
      }

      .palette-color-constainer {
        width: 100%;
        flex: 1;
        display: flex;
        flex-direction: column;
        border: 1px solid #999;
      }

      .picked-colors-container {
        display: flex;
        flex: 1;
        background-color: #DDD;
      }

      .palette-color-selected {
        border: 3px solid rgb(20, 186, 247);
        box-sizing: border-box;
      }
    `;
  }

  template() {
    return html`
      <div class="container">
        <div class="content">
          <div id="floating-color-block" class="floating-color-block"></div>
          <div class="title">Sort colors</div>
          <div class="sub-header">Click and drag color across</div>

          <div class="row">

            <!-- all colors -->
            <div class="column" style="padding-right: 24px;">
              <div class="colors-container column">
                ${this.colors.map((c, i) => html`
                  <div class="color-block" style="background-color: ${c}" color-id="${i}" is-picked="false"></div>
                `).join('\n')}
              </div>
            </div>

            <!-- palettes -->
            <div class="palette-container">
              ${this.palettes.map((p, pi) => html`
                <div class="column spaced-end" style="flex: 1;">
                  ${p.map((c, i) => html`
                    <div class="palette-color-constainer">
                      <div class="row">
                        <div class="color-block palette-color" style="background-color: rgba(${c}); flex: 1;"></div>
                      </div>
                      <div class="picked-colors-container" container-location="${pi}-${i}">
                      </div>
                    </div>
                  `).join('\n')}
                </div>
              `).join('\n')}
            </div>
          </div>

          <div class="row" style="margin-top: 24px;">
            <button id="ok">ok</button>
            <button id="cancel">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }
});
