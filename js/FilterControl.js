/**
 * @constructor
 */
function FilterControl(id, toggleId, type, cutoff, context, pubsub, socket) {
  this.id = id;
  this.toggleId = toggleId;
  this.domEl = null;
  this.node = null;
  this.toggleEl = null;
  this.type = type;
  this.cutoffFrequency = cutoff;
  this.isEnabled = false;
  this.context = context;
  this.pubsub = pubsub;
  this.socket = socket;
}

/**
 * @method init setup the instance
 * @param node {object} instance of context.createBiquadFilterNode()
 * @return this
 */
FilterControl.prototype.init = function(node) {
  this.setDomEl();
  this._setToggleEl();
  this._setIsEnabled();
  this._setNode(node);
  this._setFilterType(this.type);
  this._setCutoffFrequency(this.cutoffFrequency);
  this._handleEvents();
  this._handleIO();
  return this;
}

/**
 * @method sets the biquadfilternode instances filter type
 * @param type {string} filter type per the webaudio BiQuadFilter w3c spec:
 *  http://www.w3.org/TR/webaudio/#BiquadFilterNode-section
 * @return this
 */
FilterControl.prototype._setFilterType = function(type) {
  if (this.node === null) {
    throw new ReferenceError('FilterControl.node is not defined', 'FilterControl');
  }
  this.node.type = type || 'lowpass';
  return this;
}

/**
 * @method sets the biquadfilternode instances frequency cutoff value
 * @param frequency {number} the cutoff frequency value (in Hz)
 * @return this
 */
FilterControl.prototype._setCutoffFrequency = function(frequency) {
  if (this.node === null) {
    throw new ReferenceError('FilterControl.node is not defined', 'FilterControl');
  }
  this.node.frequency.value = frequency || 440;
}

/**
 * @method set the FilterControl instance dom element reference
 * @return this
 */
FilterControl.prototype.setDomEl = function() {
  this.domEl = document.getElementById(this.id);
  return this;
}

/**
 * @method set the FilterControl instance toggle dom element reference
 * @return this
 */
FilterControl.prototype._setToggleEl = function() {
  this.toggleEl = document.getElementById(this.toggleId);
  return this;
}

FilterControl.prototype._setIsEnabled = function() {
  this.isEnabled = (this.toggleEl !== null) ? this.toggleEl.checked : false;
}

/**
 * @method set node property
* @param node {object} instance of context.createFilterNode()
* @return this
*/
FilterControl.prototype._setNode = function(node) {
  this.node = node;
  return this;
}

// Again, borrowed with gratitude from:
// http://www.html5rocks.com/en/tutorials/webaudio/intro/js/filter-sample.js
FilterControl.prototype.changeFilter = function(element) {
  // Clamp the frequency between the minimum value (40 Hz) and half of the
  // sampling rate.
  var minValue = 40;
  var maxValue = this.context.sampleRate / 2;
  // Logarithm (base 2) to compute how many octaves fall in the range.
  var numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2;
  // Compute a multiplier from 0 to 1 based on an exponential scale.
  var multiplier = Math.pow(2, numberOfOctaves * (element.value - 1.0));
  // Get back to the frequency value between min and max.
  this.node.frequency.value = maxValue * multiplier;
}

/**
 * @method bind listeners to events
 * @private
 * @return undefined
 */
FilterControl.prototype._handleEvents = function() {
  var self = this;

  //input
  this.domEl.addEventListener('input', function(e) {
    self.changeFilter(e.target);
  }, false);

  this.toggleEl.addEventListener('click', function(e) {
    self.isEnabled = self.toggleEl.checked;
    self.pubsub.emit('filter:enabled:' + self.isEnabled);
  }, false);
}

/**
 * @method handle websockets events
 */
FilterControl.prototype._handleIO = function() {
  var self = this;

  this.socket.emit('control:filter:loaded');

  this.socket.on('j5:button1:down', function() {
    //console.log('j5:button1:down');
    self.isEnabled = !self.isEnabled;
    self.toggleEl.checked = self.isEnabled;
    self.pubsub.emit('filter:enabled:' + self.isEnabled);
  });

  this.socket.on('j5:potFilter:read', function(data) {
    //console.log('j5:potFilter:read');
    self.domEl.value = data.calculated;
    self.changeFilter(self.domEl);
  });
}

module.exports = FilterControl;
