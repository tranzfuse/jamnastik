/**
 * @constructor
 */
function QControl(id, socket) {
  this.id = id;
  this.socket = socket;
  this.domEl = null;
  this.node = null;
  this.mult = 30;
}

/**
 * Init setup the instance
 * @param node {object} instance of context.createQNode()
 * @return this
 */
QControl.prototype.init = function(node) {
  this.setDomEl();
  this._setNode(node);
  this._handleEvents();
  this._handleIO();
  return this;
}

/**
 * Set the QControl instance dom element reference
 * @return this
 */
QControl.prototype.setDomEl = function() {
  this.domEl = document.getElementById(this.id);
  return this;
}

/**
 * Set node property
 * @param node {object} instance of context.createQNode()
 * @return this
 */
QControl.prototype._setNode = function(node) {
  this.node = node;
  return this;
}

// Again, borrowed with gratitude from:
// http://www.html5rocks.com/en/tutorials/webaudio/intro/js/filter-sample.js
QControl.prototype.changeQ = function(element) {
  this.node.Q.value = element.value * this.mult;
}

/**
 * Bind listeners to events
 * @private
 * @return undefined
 */
QControl.prototype._handleEvents = function() {
  var self = this;

  //input
  this.domEl.addEventListener('input', function(e) {
    self.changeQ(e.target);
  }, false);
}

/**
 * Handle websockets events and communication
 */
QControl.prototype._handleIO = function() {
  var self = this,
    qKnob = document.getElementById('q-knob');

  this.socket.emit('control:q:loaded');

  this.socket.on('j5:potQ:read', function(data) {
    self._updateKnob(data);
  });
}

/**
 * Update q ui knob value and rotate it as incoming
 * data is received from arduino controller
 * @private
 * @param data {object} The incoming data stream from websockets
 */
QControl.prototype._updateKnob = function(data) {
  var qKnob = document.getElementById('q-knob');

  this.domEl.value = data.calculated;
  this.changeQ(this.domEl);
  qKnob.style.webkitTransform = 'rotate(' + Math.floor(data.knob) + 'deg)';
}

/**
 * Fired when the init method is called
 *
 * @event
 * @name control:q:loaded
 * @memberOf QControl
 */

module.exports = QControl;
