const {
  customElements,
  HTMLElementExtended,
  html,
  css
} = require('@webformula/pax-core');
const CanvasToGameboyC = require('../global/CanvasToGameboyC');

customElements.define('upload-dialog', class extends HTMLElementExtended {
  constructor() {
    super();

    this.bound_loadImage = this.loadImage.bind(this);
    this.bound_ok = this.ok.bind(this);
    this.bound_cancel = this.cancel.bind(this);

    this.cloneTemplate();
  }

  connectedCallback() {
    this.shadowRoot.querySelector('input[type=file]').addEventListener('change', this.bound_loadImage);
    this.shadowRoot.querySelector('#ok').addEventListener('click', this.bound_ok);
    this.shadowRoot.querySelector('#cancel').addEventListener('click', this.bound_cancel);
  }

  disconnectedCallback() {
    this.shadowRoot.querySelector('input[type=file]').removeEventListener('change', this.bound_loadImage);
    this.shadowRoot.querySelector('#ok').removeEventListener('click', this.bound_ok);
    this.shadowRoot.querySelector('#cancel').removeEventListener('click', this.bound_cancel);
  }

  get displayCanvas() {
    return this.shadowRoot.querySelector('#display-canvas');
  }

  get canvas() {
    return this.canvas_;
  }

  set canvas(value) {
    this.canvas_ = value;
  }

  get image() {
    return this.shadowRoot.querySelector('img');
  }

  set size(value) {
    return this.shadowRoot.querySelector('#size').innerText = value;
  }

  loadImage(e) {
    if(e.target.files.length === 0) return;
    const file = e.target.files[0];
    if(file.type !== '' && !file.type.match('image.*')) return;

    this.image.addEventListener('load', () => {
      this.hasImage = true;
      // TODO display actual size. this is css max width
      this.size = `${this.image.width} x ${this.image.height}`;
    }, false);
    this.image.src = window.URL.createObjectURL(file);
  }

  ok() {
    if (this.hasImage) this.canvas.drawImage(this.image, 0, 0);
    this.remove();
  }

  cancel() {
    this.remove();
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

      .content {
        padding: 24px;
      }

      .row {
        display: flex;
        flex-direction: row;
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

      #ok {
        margin-right: 6px;
      }

      #image-container {
          margin-top: 18px;
      }

      #image-container img {
        max-width: 400px;
        height: auto;
      }
    `;
  }


  template() {
    return html`
      <div class="container">
        <div class="content">
          <div class="title">Upload</div>

          <div>
            <label id="browser" class="button" for="fileChooser">Browse</label>
            <input hidden="true" type="file" name="fileChooser" id="fileChooser" accept="image/jpeg,image/png">
          </div>

          <div id="image-container">
            <div id="size"></div>
            <img></img>
          </div>

          <div class="row">
            <button id="ok">OK</button>
            <button id="cancel">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }
});
