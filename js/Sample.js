/**
 * @constructor
 */
function Sample (url, buffer) {
	this.url = url;
  this.buffer = buffer;
  this.source = null;
};

/**
 * @method
 * @param when {number} when to being playback
 * @return this
 */
Sample.prototype.play = function (when) {
  when = when || 0;

  // create sample's sound source
  this.source = app.context.createBufferSource();

  // tell source which sound to play
  this.source.buffer = this.buffer;

  // connect source to context's destination
  // (speakers, in this case)
  this.source.connect(app.context.destination);
  this.source.start(when);

  return this;
}

module.exports = Sample;
