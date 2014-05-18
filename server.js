// socket.io way
var j5 = require('johnny-five'),
  express = require('express'),
  app = express(),
  server = require('http').createServer(app),
  io = require('socket.io').listen(server),
  port = process.env.PORT || 4567;

var controllerAttached = true;

//johnny-five thingies
var potFilter, potQ;
var potGain;

var btn1, btn2, btn3, btn4, btn5, btn6, btn7, btn8,
  btn9, btn10, btn11, btn12, btn13, btn14, btn15, btn16;

var btnFilter;

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
    if (controllerAttached) {
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
          pin: 'A15',
          freq: 250
        });

        potFilter.on('read', function() {
          var calcValue = normalize(inputFilterMax, potMax, this.raw);
          var knobValue = normalize(knobMax, potMax, this.raw);

          socket.emit('j5:potFilter:read', {calculated: calcValue, knob: knobValue});
        });

        // Q
        potQ = new j5.Sensor({
          pin: 'A14',
          freq: 250
        });

        potQ.on('read', function() {
          // 1 = max range value of html input
          // 270 = max rotation of the knob
          // 1023 = max range value of potentiometer
          var calcValue = normalize(inputFilterMax, potMax, this.raw);
          var knobValue = normalize(knobMax, potMax, this.raw);

          socket.emit('j5:potQ:read', {calculated: calcValue, knob: knobValue});
        });

        btnFilter = new j5.Button(22);

        btnFilter.on('down', function() {
          socket.emit('j5:buttonFilter:down');
        });

        // Gain
        potGain = new j5.Sensor({
          pin: 'A13',
          freq: 250
        });

        potGain.on('read', function() {
          // 270 = max rotation of the knob
          // 1023 = max range value of potentiometer
          var calcValue = normalize(inputGainMax, potMax, this.raw);
          var knobValue = normalize(knobMax, potMax, this.raw);

          socket.emit('j5:potGain:read', {calculated: calcValue, knob: knobValue});
        });

        // Sequencer Buttons
        btn1 = new j5.Button(2);
        btn2 = new j5.Button(3);
        btn3 = new j5.Button(4);
        btn4 = new j5.Button(5);
        btn5 = new j5.Button(6);
        btn6 = new j5.Button(7);
        btn7 = new j5.Button(8);
        btn8 = new j5.Button(9);

        btn9 = new j5.Button(21);
        btn10 = new j5.Button(20);
        btn11 = new j5.Button(19);
        btn12 = new j5.Button(18);
        btn13 = new j5.Button(17);
        btn14 = new j5.Button(16);
        btn15 = new j5.Button(15);
        btn16 = new j5.Button(14);

        btn1.on('down', function() {
          socket.emit('j5:button:down', {row: 1, col: 1, number: 1});
        });

        btn2.on('down', function() {
          socket.emit('j5:button:down', {row: 1, col: 2, number: 2});
        });

        btn3.on('down', function() {
          socket.emit('j5:button:down', {row: 1, col: 3, number: 3});
        });

        btn4.on('down', function() {
          socket.emit('j5:button:down', {row: 1, col: 4, number: 4});
        });

        btn5.on('down', function() {
          socket.emit('j5:button:down', {row: 1, col: 5, number: 5});
        });

        btn6.on('down', function() {
          socket.emit('j5:button:down', {row: 1, col: 6, number: 6});
        });

        btn7.on('down', function() {
          socket.emit('j5:button:down', {row: 1, col: 7, number: 7});
        });

        btn8.on('down', function() {
          socket.emit('j5:button:down', {row: 1, col: 8, number: 8});
        });

        btn9.on('down', function() {
          socket.emit('j5:button:down', {row: 5, col: 1, number: 9});
        });

        btn10.on('down', function() {
          socket.emit('j5:button:down', {row: 5, col: 2, number: 10});
        });

        btn11.on('down', function() {
          socket.emit('j5:button:down', {row: 5, col: 3, number: 11});
        });

        btn12.on('down', function() {
          socket.emit('j5:button:down', {row: 5, col: 4, number: 12});
        });

        btn13.on('down', function() {
          socket.emit('j5:button:down', {row: 5, col: 5, number: 13});
        });

        btn14.on('down', function() {
          socket.emit('j5:button:down', {row: 5, col: 6, number: 14});
        });

        btn15.on('down', function() {
          socket.emit('j5:button:down', {row: 5, col: 7, number: 15});
        });

        btn16.on('down', function() {
          socket.emit('j5:button:down', {row: 5, col: 8, number: 16});
        });

      }); //end j5
    }

  });

});

/**
 * Normalize a given value from a larger range of numbers to a smaller
 * range of numbers.
 * Specifically, this is normalizing the pot range of 0 - 1023 to the html range input of 1 - 100
 *
 * @param scaleMax {number} The largest number in the range being scaled to
 * @param rangeMax {number} The largest number in the range the value appeared in
 * @param value {number} The number to be scaled
 * @return number
 */
function normalize(scaleMax, rangeMax, value) {
  return scaleMax * (value / rangeMax);
}
