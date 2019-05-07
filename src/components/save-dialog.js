const {
  customElements,
  HTMLElementExtended,
  html,
  css
} = require('@webformula/pax-core');

customElements.define('save-dialog', class extends HTMLElementExtended {
  constructor() {
    super();
    this.cloneTemplate();
  }

  connectedCallback() {
    this.bound_save = this.save.bind(this);
    this.saveButton.addEventListener('click', this.bound_save);
  }

  disconnectedCallback() {
    this.saveButton.removeEventListener('click', this.bound_save);
  }

  get saveButton() {
    return this.shadowRoot.querySelector('#save-button');
  }

  get imageType() {
    return this.shadowRoot.querySelector('select[name="imageType"]').value;
  }

  get extension() {
    return this.imageType.split('/')[1].toLowerCase();
  }

  get fileName() {
    return `${this.shadowRoot.querySelector('input[name="fileName"]').value.split('.')[0]}.${this.extension}`;
  }

  save() {
    this.downloadFile();
    this.dispatchEvent(new CustomEvent('save', {
      detail: {
        fileName: this.fileName,
        imageType: this.imageType
      }
    }));
    this.remove();
  }

  downloadFile() {
    const link = document.createElement('a');
    link.download = this.fileName;
    link.href = document.querySelector('draw-canvas').getDataURL(this.imageType);
    link.click();
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

      button:hover {
        cursor: pointer;
        background-color: #EEE;
      }
    `;
  }


  template() {
    return html`
      <div class="container">
        <div class="content">
          <div class="title">Save</div>

          <label for="fileName">File name: </label>
          <input name="fileName" value="name">

          <br/>

          <label for="imageType">Image type: </label>
          <select name="imageType">
            <option selected value="image/png">PNG</option>
            <option value="image/jpg">JPG</option>
            <option value="image/gif">GIF</option>
          </select>

          <div class="controls">
            <button id="save-button">save</button>
          </div>
        </div>
      </div>
    `;
  }
});