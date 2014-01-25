/**
 * @constructor
 */
function DrumMachine(id, pads) {
  this.id = id;
  this.domEl = el;

  /**
   * @property pads {array} array of pad instances
   */
  this.pads = pads;
}

/**
 * @method Setup the DrumMachine instance
 * @return this
 */
DrumMachine.prototype.init = function() {
  this.setDomEl();
  return this;
}

/**
 * @method Sets the DrumMachine instances dom element reference
 * @return this
 */
DrumMachine.prototype.setDomEl = function() {
  this.domEl = document.getElementById(this.id);
  return this;
}
