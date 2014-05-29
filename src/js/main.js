var App = require('./App');

window.app = new App();

// Bootstrap it.
window.addEventListener('load', function () {
  'use strict';

  app.init();

}, false);
