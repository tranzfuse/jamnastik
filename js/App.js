var sampleUrls = require('./sampleUrls');
var DrumMachine = require('./DrumMachine');
var BufferLoader = require('./BufferLoader');
var Sample = require('./Sample');

// Sort out the AudioContext
window.AudioContext = window.AudioContext ||
  window.webkitAudioContext ||
  window.mozAudioContext ||
  window.oAudioContext ||
  window.msAudioContext;

/**
 * @contructor
 */
function App() {
  this.context = null;
  this.bufferLoader = null;
  this.bufferList = null;
  this.drumMachine = null;
  this.sampleUrls = null;
  this.samples = [];
}

/**
 * @method Bootstrap the app
 * @return this
 */
App.prototype.init = function() {
  var body,
    callback = this.callbackLoaded.bind(this);

  if (window.AudioContext) {
    this.context = new AudioContext();
    this.drumMachine = new DrumMachine('drum-machine');
    this.sampleUrls = sampleUrls;
    this.bufferLoader = new BufferLoader(
      this.context,
      this.sampleUrls,
      callback
    );
    this.bufferLoader.load();
  } else {
    // Tell user to use a better browser.
    body = document.getElementsByTagName('body');
    body[0].innerHTML('<h1>Aww snap! This browser does not support the Web Audio API.</h1>');
  }

  return this;
}

/**
 * @method callback passed as a parameter to the BufferLoader instance
 * @param bufferList {array}
 */
App.prototype.callbackLoaded = function(bufferList) {
  this.setBufferList(bufferList);
  this.createSamples();
  this.drumMachine.init(this.samples, this.context, this.bufferList);
}

App.prototype.createSamples = function() {
  for (var i = 0; i < this.bufferList.length; i++) {
    this.samples[i] = new Sample(this.sampleUrls[i], this.bufferList[i]);
  }
  return this;
}

/**
 * @method setter
 * @param bufferList {array}
 * @return this
 */
App.prototype.setBufferList = function(bufferList) {
  this.bufferList = bufferList;
  return this;
}

module.exports = App;
