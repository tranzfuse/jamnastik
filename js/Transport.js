function Transport(id, playId, pauseId, context, pubsub) {
  this.id = id;
  this.playId = playId;
  this.pauseId = pauseId;
  this.context = context;
  this.pubsub = pubsub;
  this.domEl = null;
  this.playEl = null;
  this.pauseEl = null;
  this.isPlaying = false;
}

Transport.prototype.init = function() {
  this.setDomEl();
  this.setPlayEl();
  this.setPauseEl();
  this._handleEvents();
}

/**
 * @method set the Transport instance dom element reference
 * @return this
 */
Transport.prototype.setDomEl = function() {
  this.domEl = document.getElementById(this.id);
  return this;
}

Transport.prototype.setPlayEl = function() {
  this.playEl = document.getElementById(this.playId);
  return this;
}

Transport.prototype.setPauseEl = function() {
  this.pauseEl = document.getElementById(this.pauseId);
  return this;
}

Transport.prototype.togglePlay = function() {
  this.isPlaying = !this.isPlaying;
  if (this.isPlaying) {
    this.pubsub.emit('transport:play');
  } else {
    this.pubsub.emit('transport:pause');
  }
}

/**
 * @method bind listeners to events
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

module.exports = Transport;
