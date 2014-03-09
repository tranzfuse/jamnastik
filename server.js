var j5 = require('johnny-five'),
  express = require('express'),
  app = express(),
  server = require('http').createServer(app),
  io = require('socket.io').listen(server),
  utils = require('./js/utils'),
  port = process.env.PORT || 4567;

var isArduinoConnected = false;

//johnny-five thingies
var potFilter, potQ;
var potGain;
var button1, button2;

server.listen(port);

// app configuration
app.use(express.static(__dirname + '/public'));

// app routes
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/index.html');
});

// manage websockets events
io.sockets.on('connection', function (socket) {

  socket.on('app:loaded', function() {

    // manage johnny-five
    if (isArduinoConnected) {
      j5.Board().on('ready', function() {
        // 100 = max range value of gain html range input
        var inputGainMax = 100;
        // 1 = max range value of filter/q html range input
        var inputFilterMax = 1;
        // 270 = max rotation of the knob
        var knobMax = 270;
        // 1023 = max range value of potentiometer
        var potMax = 1023;

        socket.emit('j5:ready');

        // Filter, lo-pass
        potFilter = new j5.Sensor({
          pin: 'A0',
          freq: 250
        });

        potFilter.on('read', function() {
          var calcValue = utils.normalize(inputFilterMax, potMax, this.raw);
          var knobValue = utils.normalize(knobMax, potMax, this.raw);

          socket.emit('j5:potFilter:read', {calculated: calcValue, knob: knobValue});
        });

        // Q
        potQ = new j5.Sensor({
          pin: 'A1',
          freq: 250
        });

        potQ.on('read', function() {
          var calcValue = utils.normalize(inputFilterMax, potMax, this.raw);
          var knobValue = utils.normalize(knobMax, potMax, this.raw);

          socket.emit('j5:potQ:read', {calculated: calcValue, knob: knobValue});
        });

        // Gain
        potGain = new j5.Sensor({
          pin: 'A2',
          freq: 250
        });

        potGain.on('read', function() {
          var calcValue = utils.normalize(inputGainMax, potMax, this.raw);
          var knobValue = utils.normalize(knobMax, potMax, this.raw);

          socket.emit('j5:potGain:read', {calculated: calcValue, knob: knobValue});
        });

        //button 1
        button1 = new j5.Button({
          pin: 2
        });

        button1.on('down', function() {
          socket.emit('j5:button1:down');
        });

      }); //end j5
    }

  });

});
