var port = 6379,
  host = '127.0.0.1',
  redis = require('redis'),
  client = redis.createClient(port, host);

//redis client event handlers
client.on('error', function(err) {
  console.log('REDIS Error: ', err);
});

client.on('ready', function() {
  console.log('REDIS Ready');
});

module.exports = client;
