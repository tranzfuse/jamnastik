/**
 * @constructor
 */
function GainControl(id, socket, pubsub) {
  this.id = id;
  this.socket = socket;
  this.pubsub = pubsub;
  this.domEl = null;
  this.node = null;
}

/**
 * @method init setup the instance
 * @param node {object} instance of context.createGainNode()
 * @return this
 */
GainControl.prototype.init = function(node) {
  this.setDomEl(this.id);
  this._setNode(node);
  this._handleEvents();
  this._handleIO();
  return this;
}

/**
 * @method set the GainControl instance dom element reference
 * @return this
 */
GainControl.prototype.setDomEl = function() {
  this.domEl = document.getElementById(this.id);
  return this;
}

/**
 * @method set node property
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
 * @method bind listeners to events
 * @private
 * @return undefined
 */
GainControl.prototype._handleEvents = function() {
  var self = this;

  //input
  this.domEl.addEventListener('input', function(e) {
    self.changeGain(e.target);
  }, false);
}

/**
 * @method handle websockets events
 */
GainControl.prototype._handleIO = function() {
  var self = this;

  this.socket.emit('control:gain:loaded');

  this.socket.on('j5:potGain:read', function(data) {
    console.log('j5:potGain:read');
    self.domEl.value = data.calculated;
    self.changeGain(self.domEl);
  });
}

module.exports = GainControl;
