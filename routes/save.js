var crypto = require('crypto'),
  redisClient = require('../src/js/redisClient');

module.exports = function (app) {

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

      redisClient.get(key, function(err, reply) {
        if (null === reply) {
          console.log('object NOT found in REDIS, saving...');

          redisClient.set(key, JSON.stringify(response), function(err, reply) {
            if (err) {
              console.log('REDIS Error', err);
            }
            res.json(response);
          });

          return;
        }

        res.json(reply);
      });
    });
  });

}
