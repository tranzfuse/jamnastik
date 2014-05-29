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
          pin: 'A15',
          freq: 250
        });

        potFilter.on('read', function() {
          var calcValue = utils.normalize(inputFilterMax, potMax, this.raw);
          var knobValue = utils.normalize(knobMax, potMax, this.raw);

          socket.emit('j5:potFilter:read', {calculated: calcValue, knob: knobValue});
        });

        // Q
        potQ = new j5.Sensor({
          pin: 'A14',
          freq: 250
        });

        potQ.on('read', function() {
          var calcValue = utils.normalize(inputFilterMax, potMax, this.raw);
          var knobValue = utils.normalize(knobMax, potMax, this.raw);

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
          var calcValue = utils.normalize(inputGainMax, potMax, this.raw);
          var knobValue = utils.normalize(knobMax, potMax, this.raw);

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
