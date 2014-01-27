/**
 * @constructor
 */
function Pad(id, sample, key, domEl) {
  this.id = id;
  this.sample = sample;
  this.key = key;
  this.domEl = domEl;
}

/**
 * Bind event listeners for events we're interested in.
 * @method
 * @param when {number} Where to begin playback
 * @return this
 */
Pad.prototype.press = function(when) {
  this.sample.play(when);
  return this;
}

module.exports = Pad;
