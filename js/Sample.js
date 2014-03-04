/**
 * @constructor
 */
function Sample (context, pubsub, filterNode, gainNode, url, buffer) {
  this.context = context;
  this.pubsub = pubsub;
  this.filterNode = filterNode;
  this.gainNode = gainNode;
	this.url = url;
  this.buffer = buffer;
  this.source = null;
  this.filterEnabled = null;
};

/**
 * Setup the sample instance
 * @param isEnabled {boolean} value to se the isFilterEnabled property
 * @return this
 */
Sample.prototype.init = function(isEnabled) {
  var self = this;

  this.setFilterEnabled(isEnabled);

  this.pubsub.on('filter:enabled:true', function() {
    self.setFilterEnabled(true);
  });

  this.pubsub.on('filter:enabled:false', function() {
    self.setFilterEnabled(false);
  });

  return this;
}

/**
 * Set the filterEnabled property
 * @param isEnabled {boolean}
 * @return this
 */
Sample.prototype.setFilterEnabled = function(isEnabled) {
  this.filterEnabled = isEnabled;
  return this;
}

/**
 * Play the sound!
 * @param time {number} time to begin playback
 * @return this
 */
Sample.prototype.play = function (time) {
  time = time || 0;

  // create sample's sound source
  this.source = this.context.createBufferSource();

  // tell source which sound to play
  this.source.buffer = this.buffer;

  // connect source to specified nodes and destination
  // @TODO totally not sustainable, come up with something more clever
  // and abstract this out of here too.
  if (this.filterNode && this.filterEnabled && this.gainNode) {
    this.source.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);
  } else if (this.filterNode && this.filterEnabled) {
    this.source.connect(this.filterNode);
    this.filterNode.connect(this.context.destination);
  } else if (this.gainNode) {
    this.source.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);
  } else {
    this.source.connect(this.context.destination);
  }

  this.source.start(time);

  return this;
}

/**
 * @param time {number} which point to stop the sample playback
 * @return this
 */
Sample.prototype.stop = function(time) {
  this.source.stop(time);
  return this;
}

module.exports = Sample;
