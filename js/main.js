var BufferLoader = require('./BufferLoader');
var Pad = require('./Pad');
var Sample = require('./Sample');

/**
 * @var context {object} instance of AudioContext.
 */
var context;

/**
 * @var bufferLoader {object} instance of BufferLoader class.
 */
var bufferLoader;

/**
 * @var pads {array} Data store for drum machine pads
 */
var pads = [];

/**
 * @var sampleUrls {array} Store urls of audio samples.
 */
var sampleUrls = [
  //row 1
  'audio/808/808_Clap.wav',
  'audio/808/808_Clave.wav',
  'audio/808/808_Cowbell.wav',
  'audio/808/808_Cymbal-high.wav',

  //row2
  'audio/808/808_Cymbal_low.wav',
  'audio/808/808_Hat_closed.wav',
  'audio/808/808_Hat_long.wav',
  'audio/808/808_Hat_medium.wav',

  //row3
  'audio/808/808_Hi_Conga.wav',
  'audio/808/808_Hi_Tom.wav',
  'audio/808/808_Kick_long.wav',
  'audio/808/808_Kick_short.wav',

  //row4
  'audio/808/808_Lo_Conga.wav',
  'audio/808/808_Lo_Tom.wav',
  'audio/808/808_Snare_hi1.wav',
  'audio/808/808_Md_Conga.wav'
];

/**
 * @var samples {array} Data store for Sample instances.
 */
var samples = [];

// Sort out the AudioContext
window.AudioContext = window.AudioContext || window.webkitAudioContext;
context = new AudioContext();

// Create new sample instances, store in samples array,
// attach to pad.
for (var i=0; i < sampleUrls.length; i++) {
  samples[i] = new Sample(sampleUrls[i]);
  pads[i] = new Pad('pad' + (i + 1), samples[i]);
  pads[i].init();
}

bufferLoader = new BufferLoader(
  context,
  sampleUrls,
  finishedLoading
);

// Callback for BufferLoader
function finishedLoading(bufferList) {
  for (var i = 0; i < bufferList.length; i++) {
    pads[i].press(context, bufferList[i], 0);
  }
}

module.exports = bufferLoader;

// Bootstrap it.
window.addEventListener('load', function () {
  'use strict';

  console.log('window load event');
  bufferLoader.load();
}, false);
