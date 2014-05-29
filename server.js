var j5 = require('johnny-five'),
  express = require('express'),
  app = express(),
  server = require('http').createServer(app),
  io = require('socket.io').listen(server),
  utils = require('./js/utils'),
  fs = require('fs'),
  crypto = require('crypto'),
  port = process.env.PORT || 4567,
  redis = require('redis'),
  client = redis.createClient(6379, '127.0.0.1');

client.on('error', function(err) {
  console.log('REDIS Error: ', err);
});

client.on('ready', function() {
  console.log('REDIS Ready');
});

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

app.get('/jam/:checksum', function (req, res) {
  var filePath = 'saved/',
    fileName = req.params.checksum + '.json';

  fs.readFile(filePath + fileName, {'encoding': 'utf-8', 'flag': 'r'}, function(err, data) {
    if (err) {
      //maybe show some better messaging?
      console.log('File ', fileName, ' not found.');
      res.redirect('/');
    }
    console.log(data);
    res.send(data);
  });
});

app.post('/save', function(req, res) {
  var buffer = '',
    md5 = crypto.createHash('md5');

  req.on('data', function(chunk) {
    buffer += chunk;
    md5.update(buffer);
  });

  req.on('end', function() {
    var key = md5.digest('hex'),
      response = {
        buffer: buffer,
        hash: key
      };

    client.get(key, function(err, reply) {
      if (null === reply) {
        console.log('object NOT found in redis, saving...');

        client.set(key, JSON.stringify(response), function(err, reply) {
          if (err) {
            //well?
          }
          client.get(key, function(err, reply) {
            if (err) {
              //well?
            }
            console.log('object found in redis', reply.toString());
            res.json(reply.toString());
          });
        });
      }
      res.json(reply);
    });

  });

});

// manage websockets events
io.sockets.on('connection', function(socket) {

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
