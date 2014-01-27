var App = require('./App');

window.app = new App();

// Bootstrap it.
window.addEventListener('load', function () {
  'use strict';

  console.log('window load event');
  app.init();
}, false);
