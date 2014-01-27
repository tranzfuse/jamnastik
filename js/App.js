var util = require('util');
var EventEmitter = require('events').EventEmitter;
var sampleUrls = require('./sampleUrls');
var DrumMachine = require('./DrumMachine');
var GainControl = require('./GainControl');
var FilterControl = require('./FilterControl');
var QControl = require('./QControl');
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
  this.gainControl = null;
  this.filterControl = null;
  this.qControl = null;
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
    this.pubsub = new EventEmitter();
    this.pubsub.setMaxListeners(24);
    this.context = new AudioContext();
    this.drumMachine = new DrumMachine('drum-machine');
    this.gainControl = new GainControl('gain-control');
    this.filterControl = new FilterControl('filter-control', 'filter-toggle', 'lowpass', 440);
    this.qControl = new QControl('q-control');
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

  // @TODO manage all the controls within a ControlPanel instance
  this.gainControl.init(this.context.createGain());
  this.filterControl.init(this.context.createBiquadFilter());
  // q adjusts the Q value of the BiquadFilterNode instance created for the filterControl
  this.qControl.init(this.filterControl.node);

  this.createSamples();
  this.drumMachine.init(this.samples);
}

App.prototype.createSamples = function() {
  for (var i = 0; i < this.bufferList.length; i++) {
    this.samples[i] = new Sample(this.filterControl.node, this.gainControl.node, this.sampleUrls[i], this.bufferList[i]);
    this.samples[i].init(this.filterControl.isEnabled);
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
