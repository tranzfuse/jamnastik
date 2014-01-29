var Pad = require('./Pad');
var Iterator = require('./Iterator');

/**
 * @constructor
 */
function StepSequencer(id, context, pubsub) {
  this.id = id;
  this.context = context;
  this.pubsub = pubsub;
  this.domEl = null;
  this.samples = null;
  this.rows = new Iterator();
  this.pads = {};
  this.grid = [];
  this.gridCols = 8;
  this.gridRows = 8;
  this.rowActiveClass = 'active';
}

/**
 * @method Setup the StepSequencer instance
 * @return this
 */
StepSequencer.prototype.init = function(samples) {
  this.samples = samples;
  this.setDomEl(this.id);
  this._setupGrid();
  //this._setupPads();
  this._handleEvents();
  return this;
}

/**
 * @method set the StepSequencer instance dom element reference
 * @return this
 */
StepSequencer.prototype.setDomEl = function() {
  this.domEl = document.getElementById(this.id);
  return this;
}

/**
 * @method Create the step sequencer grid of pads,
 * instantiate Pad for each cell, and append the
 * generated dom to the step-sequencer dom element.
 * @return this
 */
StepSequencer.prototype._setupGrid = function() {
  var docFrag = document.createDocumentFragment();
  var row, obj, arr = [], pad;

  for (var i = 0; i < this.gridCols; i++) {
    this.grid[i] = [];

    row = document.createElement('div');
    row.classList.add('step-row');
    row.id = 'step-row' + (i + 1);
    obj = {};
    obj['id'] = row.id;
    obj['domEl'] = row;
    arr.push(obj);

    for (var j = 0; j < this.gridRows; j++) {
      pad = document.createElement('div');
      pad.classList.add('pad', 'col', 'col' + (j + 1));
      pad.id = row.id + '_col' + (j + 1);
      this.grid[i][j] = new Pad(pad.id, this.samples[j], null, pad);
      this.pads[pad.id] = this.grid[i][j];
      row.appendChild(pad);
    }
    docFrag.appendChild(row);
  }
  this.domEl.appendChild(docFrag);
  this.rows.init(arr);
  return this;
}

StepSequencer.prototype.step = function() {
  //this.pubsub.emit('stepsequencer:step:on');

  if (!this.rows.hasNext()) {
    // better way to handle this? basically an attempt to ensure the last row
    // is updated when the sequence starts over.
    this.rows.getPrevious().domEl.classList.remove(this.rowActiveClass);
    this.rows.rewind();
  }
  if (this.rows.hasPrevious()) {
    this.rows.getPrevious().domEl.classList.remove(this.rowActiveClass);
  }
  this.rows.current().domEl.classList.add(this.rowActiveClass);
  this.rows.next();
}

/**
 * @method create pad instances for each drum machine pad, store in the StepSequencer pad property
 * @private
 * @return this
 */
StepSequencer.prototype._setupPads = function() {
  var padId, key, domEl;

  for (var i = 0; i < this.samples.length; i++) {
    padId = 'pad' + (i + 1);
    key = this._setPadKeyCode(padId);
    domEl = document.getElementById(padId);
    this.pads[padId] = new Pad(padId, this.samples[i], key, domEl);
  }
  return this;
}

/**
 * @method bind listeners to events
 * @private
 */
StepSequencer.prototype._handleEvents = function() {
  var self = this;

  this.pubsub.on('transport:play', function() {
    self.play();
  });

  this.pubsub.on('transport:pause', function() {
    self.pause();
  });

  //click
  this.domEl.addEventListener('click', function(e) {
    console.log(self.pads[e.target.id]);
    if (e.target.id in self.pads) {
      self.pads[e.target.id].toggleEnabled();
    }
  }, false);
}

StepSequencer.prototype.play = function(time) {
  var self = this;

  this.step();
  this.interval = setInterval(function() {
    self.step();
  }, time || 250);
}

StepSequencer.prototype.pause = function() {
  if (this.interval) {
    clearInterval(this.interval);
  }
}

/**
 * @method Set the drum pad's key property
 * @private
 * @param id {string} The drum pad's id
 * @return key
 */
StepSequencer.prototype._setPadKeyCode = function(id) {
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
module.exports = StepSequencer;
