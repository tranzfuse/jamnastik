/**
 * @constructor
 */
function Sample (url) {
	this.url = url;
  this.source = null;
};

/**
 * @method
 * @param source {object} the AudioContext sound source (createBufferSource)
 * @return this
 */
Sample.prototype.setSource = function (source) {
  this.source = source;

  return this;
}

/**
 * @method
 * @param context {object} the AudioContext instance
 * @param soundBuffer {object} the BufferSource instance
 * @param when {number} when to being playback
 * @return this
 */
Sample.prototype.play = function (context, soundBuffer, when) {
  when = when || 0;

  // create sample's sound source
  this.source = context.createBufferSource();

  // tell source which sound to play
  this.source.buffer = soundBuffer;

  // connect source to context's destination
  // (speakers, in this case)
  this.source.connect(context.destination);
  this.source.start(when);

  return this;
}

module.exports = Sample;
