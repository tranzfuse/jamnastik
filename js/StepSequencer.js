var Pad = require('./Pad');
var Iterator = require('./Iterator');

/**
 * @constructor
 */
function StepSequencer(id, context, pubsub, scheduler) {
  this.id = id;
  this.context = context;
  this.pubsub = pubsub;
  this.scheduler = scheduler;
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
  this._handleEvents();

  // begin the drawing loop
  //requestAnimationFrame(this.step.bind(this));
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

/**
 * @method step through each row of the sequencer, highlighting the active
 * row by adding a css class to the row, but also removing the css class from the
 * previous row
 */
StepSequencer.prototype.step = function() {
  this.scheduler.currentNote = this.scheduler.last8thNoteDrawn;
  this.scheduler.currentTime = this.context.currentTime;

  while (this.scheduler.notesInQueue.length && this.scheduler.notesInQueue[0].time < this.scheduler.currentTime) {
    this.scheduler.currentNote = this.scheduler.notesInQueue[0].note;
    this.scheduler.notesInQueue.splice(0,1);   // remove note from queue
  }

  // We only need to draw if the note has moved.
  if (this.scheduler.last8thNoteDrawn !== this.scheduler.currentNote) {
    if (!this.rows.hasNext()) {
      // better way to handle wrapping? basically an attempt to ensure the last row
      // is updated when the sequence starts over.
      this.rows.getPrevious().domEl.classList.remove(this.rowActiveClass);
      this.rows.rewind();
    }
    if (this.rows.hasPrevious()) {
      this.rows.getPrevious().domEl.classList.remove(this.rowActiveClass);
    }
    this.rows.current().domEl.classList.add(this.rowActiveClass);
    this.rows.next();

    this.scheduler.last8thNoteDrawn = this.scheduler.currentNote;
  }

  requestAnimationFrame(this.step.bind(this));
}


StepSequencer.prototype.draw = function(rowindex) {
  var previousIndex = (rowindex + 7) % 8;

  this.rows.getByIndex(previousIndex).domEl.classList.remove(this.rowActiveClass);
  this.rows.getByIndex(rowindex).domEl.classList.add(this.rowActiveClass);
}

/**
 * @method subscribe and bind listeners to events
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

StepSequencer.prototype.play = function (time) {
  this.scheduler.current8thNote = this.scheduler.current8thNote || 0;
  this.scheduler.nextNoteTime = this.context.currentTime;
  this.scheduler.run();    // kick off scheduling
}

StepSequencer.prototype.pause = function() {
  window.clearTimeout(this.scheduler.timerID);
}

module.exports = StepSequencer;
