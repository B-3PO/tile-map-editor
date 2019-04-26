const {
  PageMapper,
  buildClient,
  html
} = require('@webformula/pax-core');
require('./components/color-picker.js');
require('./components/palette-tool.js');
require('./components/draw-canvas.js');
require('./components/scale-range.js');
require('./components/grid-settings.js');
require('./components/entry-dialog.js');

const layout = require('./layout');
const pageMapper = new PageMapper('src/pages');
pageMapper.pageNotFount = '404';
pageMapper.root = 'home';
// pageMapper.route('newroute/test', 'introduction');
// pageMapper.addRoute('newroute/test', 'introduction');

buildClient({ pageMapper, layout, path: 'dist' });
