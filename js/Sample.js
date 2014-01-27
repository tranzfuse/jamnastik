/**
 * @constructor
 */
function Sample (filterNode, gainNode, url, buffer) {
  this.filterNode = filterNode;
  this.gainNode = gainNode;
	this.url = url;
  this.buffer = buffer;
  this.source = null;
  this.filterEnabled = null;
};

/**
 * @method setup the sample instance
 * @param isEnabled {boolean} value to se the isFilterEnabled property
 * @return this
 */
Sample.prototype.init = function(isEnabled) {
  var self = this;

  this.setFilterEnabled(isEnabled);

  app.pubsub.on('filter:enabled:true', function() {
    self.setFilterEnabled(true);
  });

  app.pubsub.on('filter:enabled:false', function() {
    self.setFilterEnabled(false);
  });

  return this;
}

/**
 * @method set the filterEnabled property
 * @param isEnabled {boolean}
 * @return this
 */
Sample.prototype.setFilterEnabled = function(isEnabled) {
  this.filterEnabled = isEnabled;
  return this;
}

/**
 * @method
 * @param time {number} time to being playback
 * @return this
 */
Sample.prototype.play = function (time) {
  time = time || 0;

  // create sample's sound source
  this.source = app.context.createBufferSource();

  // tell source which sound to play
  this.source.buffer = this.buffer;

  // connect source to specified nodes and destination
  // @TODO totally not sustainable, come up with something more clever
  if (this.filterNode && this.filterEnabled && this.gainNode) {
    this.source.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(app.context.destination);
  } else if (this.filterNode && this.filterEnabled) {
    this.source.connect(this.filterNode);
    this.filterNode.connect(app.context.destination);
  } else if (this.gainNode) {
    this.source.connect(this.gainNode);
    this.gainNode.connect(app.context.destination);
  } else {
    this.source.connect(app.context.destination);
  }

  this.source.start(time);

  return this;
}

module.exports = Sample;
