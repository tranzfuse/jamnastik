var Knob = require('./Knob');

/**
 * @constructor
 */
function GainControl(id, socket, pubsub) {
  this.id = id;
  this.socket = socket;
  this.pubsub = pubsub;
  this.domEl = null;
  this.node = null;
  this.knob = new Knob('gain-knob', this.pubsub, 100, true);
}

/**
 * Iinit setup the instance
 * @param node {object} instance of context.createGainNode()
 * @return this
 */
GainControl.prototype.init = function(node) {
  this.knob.init();
  this.setDomEl();
  this._setNode(node);
  this._handleEvents();
  this._handleIO();
  return this;
}

/**
 * Set the GainControl instance dom element reference
 * @return this
 */
GainControl.prototype.setDomEl = function() {
  this.domEl = document.getElementById(this.id);
  return this;
}

/**
 * Set node property
 * @param node {object} instance of context.createGainNode()
 * @return this
 */
GainControl.prototype._setNode = function(node) {
  this.node = node;
  return this;
}

// Again, borrowed with gratitude from:
// http://www.html5rocks.com/en/tutorials/webaudio/intro/js/volume-sample.js
GainControl.prototype.changeGain = function(element) {
  var volume = element.value;
  var fraction = parseInt(element.value) / parseInt(element.max);
  // Let's use an x*x curve (x-squared) since simple linear (x) does not sound as good.
  this.node.gain.value = fraction * fraction;
}

/**
 * Bind listeners to events
 * @private
 * @return undefined
 */
GainControl.prototype._handleEvents = function() {
  var self = this;

  //input
  this.domEl.addEventListener('input', function(e) {
    self.changeGain(e.target);
  }, false);

  //custom
  this.pubsub.on(self.knob.eventName, function(data) {
    self.setInputRangeValue(data.value);
    self.changeGain(self.domEl);
  });
}

/**
 * Handle websockets events
 */
GainControl.prototype._handleIO = function() {
  var self = this,
    gainKnob = document.getElementById('gain-knob');

  this.socket.emit('control:gain:loaded');

  this.socket.on('j5:potGain:read', function(data) {
    self._updateKnob(data);
  });
}

/**
 * Set the gain's html input range value
 * @param data {number}
 */
GainControl.prototype.setInputRangeValue = function(data) {
  this.domEl.value = data;
}

/**
 * Update ui knob value and rotate it as incoming
 * data is received from arduino controller
 * @private
 * @param data {object} The incoming data stream from websockets
 */
GainControl.prototype._updateKnob = function(data) {
  this.setInputRangeValue(data.calculated);
  this.changeGain(this.domEl);
  this.knob.turn(Math.floor(data.knob));
}

/**
 * Fired when the init method is called
 *
 * @event
 * @name control:gain:loaded
 * @memberOf GainControl
 */

module.exports = GainControl;
