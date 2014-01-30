// socket.io way
var j5 = require('johnny-five'),
  express = require('express'),
  app = express(),
  server = require('http').createServer(app),
  io = require('socket.io').listen(server);

//johnny-five thingies
var potFilter, potQ;
var potGain;
var button1, button2;

server.listen(4567);

// app configuration
app.use(express.static(__dirname + '/public'));

// app routes
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/index.html');
});

io.sockets.on('connection', function (socket) {

  socket.on('app:loaded', function() {

    j5.Board().on('ready', function() {

      socket.emit('j5:ready');

      // Filter, lo-pass
      potFilter = new j5.Sensor({
        pin: 'A0',
        freq: 250
      });

      potFilter.on('read', function() {
        // 100 = max range value of html input
        // 1023 = max range value of potentiometer
        var calcValue = normalize(1, 1023, this.raw);

        socket.emit('j5:potFilter:read', {raw: this.raw, calculated: calcValue});
      });

      // Q
      potQ = new j5.Sensor({
        pin: 'A1',
        freq: 250
      });

      potQ.on('read', function() {
        // 100 = max range value of html input
        // 1023 = max range value of potentiometer
        var calcValue = normalize(1, 1023, this.raw);

        socket.emit('j5:potQ:read', {raw: this.raw, calculated: calcValue});
      });

      potGain = new j5.Sensor({
        pin: 'A2',
        freq: 250
      });

      potGain.on('read', function() {
        // 100 = max range value of html input
        // 1023 = max range value of potentiometer
        var calcValue = normalize(100, 1023, this.raw);

        socket.emit('j5:potGain:read', {calculated: calcValue});
      });

      //button 1
      button1 = new j5.Button({
        pin: 2
      });

      button1.on('down', function() {
        socket.emit('j5:button1:down');
      });

      //button 2
      /*
      button2 = new j5.Button({
        pin: 3
      });

      button2.on('down', function() {
        socket.emit('j5:button2:down');
      });
      */
    });

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
