var Knob = require('./Knob');
/**
 * @constructor
 */
function QControl(id, socket, pubsub) {
  this.id = id;
  this.socket = socket;
  this.pubsub = pubsub;
  this.domEl = null;
  this.node = null;
  this.mult = 30;
  this.knob = new Knob('q-knob', this.pubsub, null, this.id + ':turn');
}

/**
 * Init setup the instance
 * @param node {object} instance of context.createQNode()
 * @return this
 */
QControl.prototype.init = function(node) {
  this.knob.init();
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

  //custom
  this.pubsub.on(self.knob.eventName, function(data) {
  console.log('q knob turn');
    self.setInputRangeValue(data.value);
    self.changeQ(self.domEl);
  });
}

/**
 * Handle websockets events and communication
 */
QControl.prototype._handleIO = function() {
  var self = this;

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
  this.setInputRangeValue(data.calculated);
  this.changeQ(this.domEl);
  this.knob.turn(Math.floor(data.knob));
}

/**
 * Set the Q's html input range value
 * @param data {number}
 */
QControl.prototype.setInputRangeValue = function(data) {
  this.domEl.value = data;
}

/**
 * Fired when the init method is called
 *
 * @event
 * @name control:q:loaded
 * @memberOf QControl
 */

module.exports = QControl;
