/**
 * Great read here:
 * http://www.html5rocks.com/en/tutorials/audio/scheduling/
 *
 * Stolen and mangled with pride from:
 * https://github.com/cwilso/metronome/blob/master/js/metronome.js
 *
 * Also borrowed some ideas from this one:
 * http://chromium.googlecode.com/svn/trunk/samples/audio/shiny-drum-machine.html
 *
 * @constructor
 */
function Scheduler(context, pubsub) {
  this.context = context;
  this.pubsub = pubsub;
  this.stepSequencer = null;

  /**
   * The start time of the entire sequence.
   */
  this.startTime;

  /**
   * What note is currently last scheduled?
   */
  this.currentNote;

  /**
   * What is the current time Mr. Templar?
   */
  this.currentTime = 0;

  /**
   * tempo (in beats per minute)
   */
  this.tempo = 120.0;

  /**
   * How frequently to call scheduling function
   * (in milliseconds)
   */
  this.lookahead = 0.0;

  /**
   * How far ahead to schedule audio (sec)
   * This is calculated from lookahead, and overlaps
   * with next interval (in case the timer is late)
   */
  this.scheduleAheadTime = 0.2;

  /**
   * when the next note is due.
   */
  this.nextNoteTime = 0.0;

  /**
   * setTimeout identifier
   */
  this.timerID = 0;

  /**
   * An attempt to sync drawing time with sound
   */
  this.lastDrawTime = -1;
}

/**
 * @method setup the instance
 * @return this
 */
Scheduler.prototype.init = function(stepSequencer) {
  this.stepSequencer = stepSequencer;
  return this;
}

/**
 * @method increment currentNote and advance nextNoteTime
 */
Scheduler.prototype.nextNote = function() {
  // Advance current note and time by a 16th note...
  // Notice this picks up the CURRENT tempo value to calculate beat length.
  var secondsPerBeat = 60.0 / this.tempo;

  // Add beat length to last beat time
  this.nextNoteTime += 0.25 * secondsPerBeat;

  // Advance the beat number, wrap to zero
  this.currentNote++;
  if (this.currentNote == this.stepSequencer.sequenceLength) {
    this.currentNote = 0;
  }
}

/**
 * @method the "loop" to "schedule" notes to be played.
 * Also tries to sync drawing time with sound playback.
 * Is triggered when play button is pressed, recurses while step sequencer is playing.
 */
Scheduler.prototype.run = function() {
  var self = this,
    activeRowSamples = [];

  this.currentTime = this.context.currentTime;

  // The sequence starts at startTime, so normalize currentTime so that it's 0 at the start of the sequence.
  this.currentTime -= this.startTime;

  // determine which pads in the step sequencer's current row are enabled
  // and create an array of the samples corresponding to the enabled pads
  // for playback.
  // @TODO Is there a much better way to manage this?
  for (var j = 0, row = this.stepSequencer.grid[this.currentNote]; j < row.length; j++) {
    if (row[j].enabled) {
      activeRowSamples.push(row[j].sample);
    }
  }

  // while there are notes that will need to play before the next interval,
  // schedule them and advance the pointer.
  while (this.nextNoteTime < this.currentTime + this.scheduleAheadTime) {
    // Convert noteTime to context time.
    var contextPlayTime = this.nextNoteTime + this.startTime;

    for (var i = 0; i < activeRowSamples.length; i++) {
      (function(x) {
        activeRowSamples[x].play(contextPlayTime);
      }(i));
    }

    // Attempt to synchronize drawing time with sound
    if (this.nextNoteTime !== this.lastDrawTime) {
      this.lastDrawTime = this.nextNoteTime;
      this.stepSequencer.draw((this.currentNote + 7) % this.stepSequencer.sequenceLength);
    }

    this.nextNote();
  }
  this.timerID = window.setTimeout(this.run.bind(this), this.lookahead);
}

module.exports = Scheduler;
