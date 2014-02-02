var Pad = require('./Pad');
var Iterator = require('./Iterator');

/**
 * @constructor
 */
function StepSequencer(id, context, pubsub, scheduler, socket) {
  this.id = id;
  this.context = context;
  this.pubsub = pubsub;
  this.scheduler = scheduler;
  this.socket = socket;
  this.domEl = null;
  this.samples = null;
  this.rows = new Iterator();
  this.pads = {};
  this.grid = [];
  this.gridCols = 8;
  this.gridRows = 8;
  this.rowActiveClass = 'active';
  this.sequenceLength = 8;
}

/**
 * Setup the StepSequencer instance
 * @return this
 */
StepSequencer.prototype.init = function(samples) {
  this.samples = samples;
  this.setDomEl(this.id);
  this._setupGrid();
  this._handleEvents();
  //this._handleIO();
  return this;
}

/**
 * Set the StepSequencer instance dom element reference
 * @return this
 */
StepSequencer.prototype.setDomEl = function() {
  this.domEl = document.getElementById(this.id);
  return this;
}

/**
 * Create the step sequencer grid of pads,
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

/**
 * Update the grid row css class
 */
StepSequencer.prototype.draw = function(rowIndex) {
  var previousIndex = (rowIndex + 7) % this.sequenceLength;

  this.rows.getByIndex(rowIndex).domEl.classList.add(this.rowActiveClass);
  this.rows.getByIndex(previousIndex).domEl.classList.remove(this.rowActiveClass);
}

/**
 * Manage websockets event communication
 */
StepSequencer.prototype._handleIO = function() {
  var self = this;

  this.socket.emit('stepsequencer:loaded');

  this.socket.on('j5:ready', function() {
    console.log('j5:ready');
  });
}

/**
 * Subscribe and bind listeners to events
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
    if (e.target.id in self.pads) {
      self.pads[e.target.id].toggleEnabled();
    }
  }, false);
}

/**
 * Kick off the scheduler loop
 */
StepSequencer.prototype.play = function (time) {
  this.scheduler.currentNote = this.scheduler.currentNote || 0;
  this.scheduler.startTime = this.context.currentTime + 0.005; // what's this 0.005 about?
  this.scheduler.nextNoteTime = 0.0;
  this.scheduler.run();    // kick off scheduling
}

/**
 * Stop the scheduler loop
 */
StepSequencer.prototype.pause = function() {
  window.clearTimeout(this.scheduler.timerID);
}

/**
 * Fired when the init method is called
 *
 * @event
 * @name stepsequencer:loaded
 * @memberOf StepSequencer
 */

module.exports = StepSequencer;
