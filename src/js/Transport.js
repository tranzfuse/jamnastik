/**
 * @constructor
 */
function Transport(id, playId, pauseId, context, pubsub) {
  this.id = id;
  this.playId = playId;
  this.pauseId = pauseId;
  this.context = context;
  this.pubsub = pubsub;
  this.domEl = document.getElementById(this.id);
  this.playEl = document.getElementById(this.playId);
  this.pauseEl = document.getElementById(this.pauseId);
  this.isPlaying = false;
}

/**
 * Setup the transport instance
 */
Transport.prototype.init = function() {
  this._handleEvents();
}

/**
 * Toggle the isPlaying property value and publish
 * a corresponding event
 */
Transport.prototype.togglePlay = function() {
  this.isPlaying = !this.isPlaying;
  if (this.isPlaying) {
    this.pubsub.emit('transport:play');
  } else {
    this.pubsub.emit('transport:pause');
  }
}

/**
 * Bind listeners to events
 * @private
 */
Transport.prototype._handleEvents = function() {
  var self = this;

  //click
  this.domEl.addEventListener('click', function(e) {

    // play
    if (e.target.id === self.playId) {
      console.log('play clicked');
      self.togglePlay();
    }

    // pause
    if (e.target.id === self.pauseId) {
      console.log('pause clicked');
      self.togglePlay();
    }
  }, false);

  //key
  document.addEventListener('keydown', function(e) {
    // space bar
    if (e.keyCode === 32) {
      self.togglePlay();
    }
  });
}

/**
 * Fired when transport is playing
 *
 * @event
 * @name transport:play
 * @memberOf Transport
 */

/**
 * Fired when transport is paused`
 *
 * @event
 * @name transport:paused
 * @memberOf Transport
 */

module.exports = Transport;
