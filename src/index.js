const {
  PageMapper,
  client,
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
require('./components/tile-palette-fixer.js');
require('./components/palette-mapper.js');
require('./components/settings-tool.js');
require('./components/save-palettes-dialog.js');

global.loadFolder('src/global');

const layout = require('./layout');
const pageMapper = new PageMapper('src/pages');
pageMapper.pageNotFount = '404';
pageMapper.root = 'home';
// pageMapper.route('newroute/test', 'introduction');
// pageMapper.addRoute('newroute/test', 'introduction');

client.build({ pageMapper, layout, path: 'dist' });
