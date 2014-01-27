var Pad = require('./Pad');

/**
 * @constructor
 */
function DrumMachine(id) {
  this.id = id;
  this.domEl = null;
  this.pads = {};
}

/**
 * @method Setup the DrumMachine instance
 * @param samples {array}
 * @return this
 */
DrumMachine.prototype.init = function(samples) {
  this.setDomEl(this.id);
  this._setupPads(samples);
  this._handleEvents();
  return this;
}

/**
 * @method set the DrumMachine instance dom element reference
 * @return this
 */
DrumMachine.prototype.setDomEl = function() {
  this.domEl = document.getElementById(this.id);
  return this;
}

/**
 * @method create pad instances for each drum machine pad, store in the DrumMachine pad property
 * @private
 * @param samples {array} sample instances
 * return this
 */
DrumMachine.prototype._setupPads = function(samples) {
  var padId, key, domEl;

  for (var i = 0; i < samples.length; i++) {
    padId = 'pad' + (i + 1);
    key = this._setPadKeyCode(padId);
    domEl = document.getElementById(padId);
    this.pads[padId] = new Pad(padId, samples[i], key, domEl);
  }
}

/**
 * @method bind listeners to events
 * @private
 * @return undefined
 */
DrumMachine.prototype._handleEvents = function() {
  var self = this;

  //click
  this.domEl.addEventListener('click', function(e) {
    if (e.target.id in self.pads) {
      self.pads[e.target.id].press();
    }
  }, false);

  //key
  document.addEventListener('keydown', function(e) {
    for (var pad in self.pads) {
      if (e.keyCode === self.pads[pad].key) {
        self.pads[pad].press();
      }
    }
  }, false);

  //@TODO add touch events
}

/**
 * @method Set the drum pad's key property
 * @private
 * @param id {string} The drum pad's id
 * @return key
 */
DrumMachine.prototype._setPadKeyCode = function(id) {
  var key = getKeyCode(id);

  if (false === key) {
    throw new Error(e);
  }

  return key;
}

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

module.exports = DrumMachine;
