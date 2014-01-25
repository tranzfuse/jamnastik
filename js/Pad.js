/**
 * @constructor
 */
function Pad(id, sample) {
  this.id = id;
  this.sample = sample;
  this.domEl = null;
  this.key = null;
}

Pad.prototype.init = function() {
  this.setDomEl();
  this.setKey(this.id);
}

/**
 * Bind event listeners for events we're interested in.
 * @method
 * @param context 
 * @param buffer
 * @param when {number} Where to begin playback
 * @return this
 */
Pad.prototype.press = function(context, buffer, when) {
  var self = this;

  this.domEl.addEventListener('click', function(e) {
    self.handleClick(e, context, buffer, when);
  }, false);

  document.addEventListener('keydown', function(e) {
    self.handleKeyDown(e, context, buffer, when);
  }, false);

  return this;
}

/**
 * Handle click on the pad
 * @method
 * @return this
 */
Pad.prototype.handleClick = function(e, context, buffer, when) {
  this.sample.play(context, buffer, when);
  return this;
}

/**
 * Handle keydown event
 * @method
 * @return this
 */
Pad.prototype.handleKeyDown = function(e, context, buffer, when) {
  if (e.keyCode === this.key || e.key === this.key) {
    this.sample.play(context, buffer, when);
  }
  return this;
}

/**
 * Set the pad's key property
 * @method
 * @return this
 */
Pad.prototype.setKey = function() {
  this.key = getKeyCode(this.id);

  if (false === this.key) {
    throw new Error(e);
  }

  return this;
}

/**
 * @method set the pad instances dom element reference
 * @return this
 */
Pad.prototype.setDomEl = function() {
  this.domEl = document.getElementById(this.id);
  return this;
}

/**
 * @method get the pad instances dom element reference
 * @return this.domEl
 */
Pad.prototype.getDomEl = function() {
  return this.domEl;
}

/**
 * @TODO: This might make more sense in a DrumMachine class
 * that manages its pads.
 */
function getKeyCode(padId) {
  var keyCodeMap = {
    //row 1
    pad1: 81, // q
    pad2: 87, // w
    pad3: 69, // e
    pad4: 82, // r

    // row 2
    pad5: 65, // a
    pad6: 83, // s
    pad7: 68, // d
    pad8: 70, // f

    // row 3
    pad9: 85, // u
    pad10: 73, // i
    pad11: 79, // o
    pad12: 80, // p

    // row 4
    pad13: 72, // h
    pad14: 74, // j
    pad15: 75, // k
    pad16: 76  // l
  };

  if (padId in keyCodeMap) {
    return keyCodeMap[padId];
  }

  return false;
}

module.exports = Pad;
