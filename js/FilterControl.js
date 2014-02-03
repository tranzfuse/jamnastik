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
  this.knobEl = null;
}

/**
 * Init setup the instance
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
 * Sets the biquadfilternode instances filter type
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
 * Sets the biquadfilternode instances frequency cutoff value
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
 * Set the FilterControl instance dom element reference
 * @return this
 */
FilterControl.prototype.setDomEl = function() {
  this.domEl = document.getElementById(this.id);
  return this;
}

/**
 * Set the FilterControl instance toggle dom element reference
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
 * Set node property
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
 * Bind listeners to events
 * @private
 * @return undefined
 */
FilterControl.prototype._handleEvents = function() {
  var self = this;

  //input
  this.domEl.addEventListener('input', function(e) {
    self.changeFilter(e.target);
  }, false);

  //click
  this.toggleEl.addEventListener('click', function(e) {
    self.isEnabled = self.toggleEl.checked;
    self.pubsub.emit('filter:enabled:' + self.isEnabled);
  }, false);
}

/**
 * Handle websockets events and communication
 */
FilterControl.prototype._handleIO = function() {
  var self = this,
    filterKnob = document.getElementById('filter-knob');

  this.socket.emit('control:filter:loaded');

  this.socket.on('j5:button1:down', function() {
    self.toggleFilter();
  });

  this.socket.on('j5:potFilter:read', function(data) {
    self._updateKnob(data);
  });
}

/**
 * Handle filter checkbox checked status; emit a corresponding event
 */
FilterControl.prototype.toggleFilter = function() {
  this.isEnabled = !this.isEnabled;
  this.toggleEl.checked = this.isEnabled;
  this.pubsub.emit('filter:enabled:' + this.isEnabled);
}

/**
 * Update filter ui knob value and rotate it as incoming
 * data is received from arduino controller
 * @private
 * @param data {object} The incoming data stream from websockets
 */
FilterControl.prototype._updateKnob = function(data) {
  var filterKnob = document.getElementById('filter-knob');

  this.domEl.value = data.calculated;
  this.changeFilter(this.domEl);
  filterKnob.style.webkitTransform = 'rotate(' + Math.floor(data.knob) + 'deg)';
}

/**
 * Fired when the filter checkbox is checked
 *
 * @event
 * @name filter:enabled:true
 * @memberOf FilterControl
 */

/**
 * Fired when the filter checkbox is unchecked
 *
 * @event
 * @name filter:enabled:false
 * @memberOf FilterControl
 */


/**
 * Fired when the init method is called
 *
 * @event
 * @name control:filter:loaded
 * @memberOf FilterControl
 */

module.exports = FilterControl;
