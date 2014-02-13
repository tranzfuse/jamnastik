/**
 * @constructor
 */
function Tempo(id, pubsub) {
  this.id = id;
  this.pubsub = pubsub;
  this.domEl = document.getElementById(this.id);
  this.tempo = 120.0;
  this.decreaseId = 'tempo-decrease';
  this.increaseId = 'tempo-increase';
  this.bpmId = 'bpm';
}

/**
 * Setup the tempo instance
 */
Tempo.prototype.init = function() {
  this._handleEvents();
}

/**
 * Returns the tempo
 * @return {number}
 */
Tempo.prototype.getTempo = function() {
  return this.tempo;
}

/**
 * Set the tempo property with the provided value
 * and publish the event
 * @param tempo {number}
 * @return this
 */
Tempo.prototype.setTempo = function(tempo) {
  if (tempo < 0) {
    tempo = 0;
  }
  if (tempo > 240) {
    tempo = 240;
  }
  this.tempo = tempo;

  this.pubsub.emit('tempo:set', {tempo: this.tempo});

  return this;
}

/**
 * Update ui with current tempo value
 */
Tempo.prototype.updateBpm = function() {
  document.getElementById(this.bpmId).innerText = this.tempo;
}

/**
 * Decrement the tempo by 1
 */
Tempo.prototype.decrease = function() {
  this.setTempo(--this.tempo);
  this.updateBpm();
}

/**
 * Increment the tempo by 1
 */
Tempo.prototype.increase = function() {
  this.setTempo(++this.tempo);
  this.updateBpm();
}

/**
 * Subscribe to and bind event listeners
 */
Tempo.prototype._handleEvents = function() {
  var self = this;

  //click
  this.domEl.addEventListener('click', function(e) {

    // decrease tempo
    if (e.target.id === self.decreaseId) {
      self.decrease();
    }

    //increase tempo
    if (e.target.id === self.increaseId) {
      self.increase();
    }
  }, false);

  //keydown
  document.addEventListener('keydown', function(e) {

    // down arrow
    if (e.keyCode === 40) {
      self.decrease();
    }

    // up arrow
    if (e.keyCode === 38) {
      self.increase();
    }
  });
}

/**
 * Fired when the tempo is set
 *
 * @event
 * @name tempo:set
 * @memberOf Tempo
 */

module.exports = Tempo;
