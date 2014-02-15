var util = require('util');
var EventEmitter = require('events').EventEmitter;
var sampleUrls = require('./sampleUrls');
var Scheduler = require('./Scheduler');
var StepSequencer = require('./StepSequencer');
var Transport = require('./Transport');
var GainControl = require('./GainControl');
var FilterControl = require('./FilterControl');
var QControl = require('./QControl');
var BufferLoader = require('./BufferLoader');
var Sample = require('./Sample');
var Tempo = require('./Tempo');
var ControlPanel = require('./ControlPanel');
var Save = require('./Save');

// Sort out the AudioContext
window.AudioContext = window.AudioContext ||
  window.webkitAudioContext ||
  window.mozAudioContext ||
  window.oAudioContext ||
  window.msAudioContext;

/**
 * @constructor
 */
function App() {
  this.socket = null;
  this.context = null;
  this.bufferLoader = null;
  this.bufferList = null;
  this.scheduler = null;
  this.stepSequencer = null;
  this.transport = null;
  this.gainControl = null;
  this.filterControl = null;
  this.qControl = null;
  this.sampleUrls = null;
  this.samples = [];
  this.tempo = null;
  this.controlPanel = null;
  this.pubsub = null;
  this.save = null;
}

/**
 * Bootstrap the app
 * @return this
 */
App.prototype.init = function() {
  var body,
    callback = this.callbackLoaded.bind(this);

  if (window.AudioContext) {
    this.socket = io.connect('http://localhost');
    this.pubsub = new EventEmitter();
    this.pubsub.setMaxListeners(0);
    this.context = new AudioContext();
    this.tempo = new Tempo('tempo', this.pubsub);
    this.controlPanel = new ControlPanel('control-panel', 'control-panel-title', this.pubsub);
    this.scheduler = new Scheduler(this.context, this.pubsub, this.tempo.tempo);
    this.stepSequencer = new StepSequencer('step-sequencer', this.context, this.pubsub, this.scheduler, this.socket);
    this.transport = new Transport('transport', 'play', 'pause', this.context, this.pubsub);
    this.gainControl = new GainControl('gain-control', this.socket, this.pubsub);
    this.filterControl = new FilterControl('filter-control', this.context, this.pubsub, this.socket, 'filter-toggle', 'lowpass', 440);
    this.qControl = new QControl('q-control', this.socket, this.pubsub);
    this.sampleUrls = sampleUrls;
    this.bufferLoader = new BufferLoader(
      this.context,
      this.sampleUrls,
      callback
    );
    this.save = new Save('save', this.filterControl, this.qControl, this.gainControl, this.tempo, this.stepSequencer);

    this.bufferLoader.load();
  } else {
    this.handleNoSupport();
  }

  return this;
}

/**
 * Callback passed as a parameter to the BufferLoader instance
 * @param bufferList {array}
 */
App.prototype.callbackLoaded = function(bufferList) {
  this.setBufferList(bufferList);

  // @TODO manage all the controls within a ControlPanel instance
  this.controlPanel.init();
  this.gainControl.init(this.context.createGain());
  this.filterControl.init(this.context.createBiquadFilter());
  this.qControl.init(this.filterControl.node);
  this.transport.init();
  this.tempo.init();

  this.createSamples();
  this.stepSequencer.init(this.samples);
  this.scheduler.init(this.stepSequencer);
  this.save.init();
  this._handleIO();
}

/**
 * Tell user to use a better browser.
 */
App.prototype.handleNoSupport = function() {
  body = document.getElementsByTagName('body');
  body[0].innerHTML('<h1>Aww snap! This browser does not support the Web Audio API.</h1>');
}

/**
 *  Handle websockets events and communication
 */
App.prototype._handleIO = function() {
  var self = this;

  this.socket.emit('app:loaded');
}

/**
 *  Errr, umm, create the sample instances
 * @return this
 */
App.prototype.createSamples = function() {
  for (var i = 0; i < this.bufferList.length; i++) {
    this.samples[i] = new Sample(this.context, this.pubsub, this.filterControl.node, this.gainControl.node, this.sampleUrls[i], this.bufferList[i]);
    this.samples[i].init(this.filterControl.isEnabled);
  }
  return this;
}

/**
 * Set bufferList property
 * @param bufferList {array}
 * @return this
 */
App.prototype.setBufferList = function(bufferList) {
  this.bufferList = bufferList;
  return this;
}

/**
 * Fired when the init method is called and app is successfully
 * bootstrapped
 *
 * @event
 * @name app:loaded
 * @memberOf App
 */

module.exports = App;
