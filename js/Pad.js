/**
 * @constructor
 */
function Pad(id, sample, key, domEl) {
  this.id = id;
  this.sample = sample;
  this.key = key;
  this.domEl = domEl;
  this.enabled = false;
  this.enabledClass = 'enabled';
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

Pad.prototype.toggleEnabled = function() {
  this.enabled = !this.enabled;
  if (this.enabled) {
    this.domEl.classList.add(this.enabledClass);
  } else {
    this.domEl.classList.remove(this.enabledClass);
  }
  return this;
}

module.exports = Pad;
