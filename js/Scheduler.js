/**
 * Great read here:
 * http://www.html5rocks.com/en/tutorials/audio/scheduling/
 *
 * Stolen and mangled with pride from:
 * https://github.com/cwilso/metronome/blob/master/js/metronome.js
 *
 * @constructor
 */
function Scheduler(context, pubsub) {
  this.context = context;
  this.pubsub = pubsub;
  this.samples = null;
  this.stepSequencer = null;

  /**
   * The start time of the entire sequence.
   */
  this.startTime;

  /**
   * What note is currently last scheduled?
   */
  this.current8thNote;

  /**
   * tempo (in beats per minute)
   */
  this.tempo = 120.0;

  /**
   * How frequently to call scheduling function
   * (in milliseconds)
   */
  this.lookahead = 25.0;

  /**
   * How far ahead to schedule audio (sec)
   * This is calculated from lookahead, and overlaps
   * with next interval (in case the timer is late)
   */
  this.scheduleAheadTime = 0.1;

  /**
   * when the next note is due.
   */
  this.nextNoteTime = 0.0;

  /**
   * 0 == 16th, 1 == 8th, 2 == quarter note
   */
  this.noteResolution = 1;

  /**
   * length of sample (in seconds)
   * This probably needs adjusting, per sample
   */
  this.noteLength = 0.05;

  /**
   * the last "box" we drew on the screen
   */
  this.last8thNoteDrawn = -1;

  /**
   * the notes that have been put into the web audio,
   * and may or may not have played yet. {note, time}
   */
  this.notesInQueue = [];

  /**
   * setTimeout identifier
   */
  this.timerID = 0;

  /**
   * An attempt to sync drawing with sound
   */
  this.lastDrawTime = -1;
}

Scheduler.prototype.init = function(samples, stepSequencer) {
  this.samples = samples;
  this.stepSequencer = stepSequencer;
}

Scheduler.prototype.nextNote = function() {
  // Advance current note and time by a 8th note...
  // Notice this picks up the CURRENT tempo value to calculate beat length.
  var secondsPerBeat = 60.0 / this.tempo;

  // Add beat length to last beat time
  this.nextNoteTime += 0.25 * secondsPerBeat;

  // Advance the beat number, wrap to zero
  this.current8thNote++;
  if (this.current8thNote == 8) {
    this.current8thNote = 0;
  }
}

Scheduler.prototype.scheduleNote = function(beatNumber, sample, time, noteLength) {
  // push the note on the queue, even if we're not playing.
  this.notesInQueue.push({note: beatNumber, time: time});
/*
  if ((this.noteResolution === 1) && (beatNumber % 2)) {
    return; // we're not playing non-8th 16th notes
  }
  if ((this.noteResolution === 2) && (beatNumber % 4)) {
    return; // we're not playing non-quarter 8th notes
  }
*/
  sample.play(time);
  //sample.stop(time + (noteLength || this.noteLength));
}

Scheduler.prototype.run = function() {
  var self = this,
    activeRowSamples = [];

  // determine which pads in the step sequencer's current row are enabled
  // and create an array of the samples corresponding to the enabled pads
  // for plauyback
  for (var j = 0, row = this.stepSequencer.grid[this.current8thNote]; j < row.length; j++) {
    if (row[j].enabled) {
      activeRowSamples.push(row[j].sample);
    }
  }

  // while there are notes that will need to play before the next interval,
  // schedule them and advance the pointer.
  while (this.nextNoteTime < this.context.currentTime + this.scheduleAheadTime) {

    for (var i = 0; i < activeRowSamples.length; i++) {

      //this.scheduleNote(self.current8thNote, self.samples[4], self.nextNoteTime);

      (function(x) {
        self.scheduleNote(self.current8thNote, activeRowSamples[x], self.nextNoteTime);
      }(i));
    }

    // Attempt to synchronize drawing time with sound
    if (this.nextNoteTime != this.lastDrawTime) {
      this.lastDrawTime = this.nextNoteTime;
      this.stepSequencer.draw((this.current8thNote + 7) % 8);
    }

    this.nextNote();
  }
  this.timerID = window.setTimeout(this.run.bind(this), this.lookahead);
}

module.exports = Scheduler;
