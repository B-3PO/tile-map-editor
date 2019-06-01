module.exports = class Settings {
  constructor() {
    this.data = JSON.parse(window.localStorage.getItem('tme_settings') || '{ "palettes": [], "colorMaps": [] }');
  }

  store() {
    window.localStorage.setItem('tme_settings', JSON.stringify(this.data));
  }

  get palettes() {
    return this.data.palettes || [];
  }

  get colorMaps() {
    return this.data.colorMaps || [];
  }

  savePalettes({ label, palettes }) {
    this.data.palettes.push({ id: Date.now(), label, palettes });
    this.store();
  }

  saveColorMap({ label, map }) {
    this.data.colorMaps.push({ id: Date.now(), label, map });
    this.store();
  }

  removePalette(id) {
    this.data.palettes = this.data.palettes.filter(o => parseInt(o.id) !== parseInt(id));
    this.store();
  }

  removeColorMap(id) {
    this.data.colorMaps = this.data.colorMaps.filter(o => parseInt(o.id) !== parseInt(id));
    this.store();
  }

  getPaletteGroup(id) {
    id = parseInt(id);
    return (this.palettes.filter(({ id }) => id === id) || [])[0];
  }
}
