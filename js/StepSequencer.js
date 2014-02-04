var Pad = require('./Pad');

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

  /**
   * Refers to row length, but also grid size (8 x 8)
   */
  this.sequenceLength = 8;

  /**
   * Stores array of object references to row dom elements
   */
  this.rows = [];

  /**
   * Stores references to each cell of the sequencer grid.
   * Each cell holds an instance of the Pad class.
   */
  this.grid = [];

  /**
   * Sequencer grid column count
   */
  this.gridCols = this.sequenceLength;

  /**
   * Sequencer grid row count
   */
  this.gridRows = this.sequenceLength;

  /**
   * A map of pad instances. The pad instance's dom element
   * id is key, pad instance is the key.
   */
  this.pads = {};

  /**
   * The grid's active row css class
   */
  this.rowActiveClass = 'active';
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
  var row, obj, pad;

  for (var i = 0; i < this.gridCols; i++) {

    //create the row dom elements
    row = document.createElement('div');
    row.classList.add('step-row');
    row.id = 'step-row' + (i + 1);

    //store references to the row dom elements
    obj = {};
    obj['id'] = row.id;
    obj['domEl'] = row;

    this.grid[i] = obj;

    //create the pads for each row
    for (var j = 0; j < this.gridRows; j++) {
      pad = document.createElement('div');
      pad.classList.add('pad', 'col', 'col' + (j + 1));
      pad.id = row.id + '_col' + (j + 1);
      this.pads[pad.id] = new Pad(pad.id, this.samples[j], null, pad);
      row.appendChild(pad);
    }
    this.grid[i].pads = this.pads;

    docFrag.appendChild(row);
  }
  this.domEl.appendChild(docFrag);

  return this;
}

/**
 * Update the grid row css class
 */
StepSequencer.prototype.draw = function(rowIndex) {
  var previousIndex = (rowIndex + 7) % this.sequenceLength;

  this.grid[rowIndex].domEl.classList.add(this.rowActiveClass);
  this.grid[previousIndex].domEl.classList.remove(this.rowActiveClass);
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
  this.scheduler.run();
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
