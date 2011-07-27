({
  appDir: '../',
  baseUrl: 'js',
  dir: '../../sakura-drops-build',
  paths: {
    'underscore': '../../bin/underscore/underscore',
    '_namespace': '../../js/underscore.namespace',
    'backbone': '../../bin/backbone/backbone',
    'jquery': '../../bin/jquery',
    'header': '../../js/header',
    'core': '../../js/hlf.util/core',
    'math': '../../js/hlf.util/math',
    'geometry': '../../js/hlf.util/geometry',
    'console': '../../js/hlf.util/console',
    'aliases': '../../js/hlf.module/third-party-aliases',
    'circle-packer': '../../js/hlf.module/circle-packer',
    'canvas': '../../js/hlf.module/canvas',
    'canvas-ui': '../../js/hlf.jquery/ui.canvas-app'
  },
  modules: [
    {
      name: 'app'
    }
  ]
})