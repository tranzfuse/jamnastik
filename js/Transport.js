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
  this.isPaused = true;
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
      self.pubsub.emit('transport:play');
    }

    // pause
    if (e.target.id === self.pauseId) {
      console.log('pause clicked');
      self.pubsub.emit('transport:pause');
    }
  }, false);
}

module.exports = Transport;
