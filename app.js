var express = require('express'),
  exphbs  = require('express3-handlebars'),
  app = express(),
  server = require('http').createServer(app),
  io = require('socket.io').listen(server),
  port = process.env.PORT || 4567,
  heresJohnny = require('./src/js/j5');

//routes
var index = require('./routes/index')(app),
  jam = require('./routes/jam')(app),
  save = require('./routes/save')(app);

process.env.NODE_ENV = 'development';

server.listen(port);

// app configuration
app.use(express.static(__dirname + '/public'));
app.engine('handlebars', exphbs({defaultLayout: 'base'}));
app.set('view engine', 'handlebars');

// manage websockets
io.sockets.on('connection', function(socket) {
  socket.on('app:loaded', function() {
    heresJohnny(socket);
  });
});
