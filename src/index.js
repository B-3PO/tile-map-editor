const {
  PageMapper,
  buildClient,
  html,
  global
} = require('@webformula/pax-core');
require('./components/color-picker.js');
require('./components/palette-tool.js');
require('./components/draw-canvas.js');
require('./components/scale-range.js');
require('./components/grid-settings.js');
require('./components/entry-dialog.js');
require('./components/tile-palette-validator.js');
require('./components/palette-display.js');
require('./components/save-dialog.js');
require('./components/upload-dialog.js');

global.loadFolder('src/global');

const layout = require('./layout');
const pageMapper = new PageMapper('src/pages');
pageMapper.pageNotFount = '404';
pageMapper.root = 'home';
// pageMapper.route('newroute/test', 'introduction');
// pageMapper.addRoute('newroute/test', 'introduction');

buildClient({ pageMapper, layout, path: 'dist' });
