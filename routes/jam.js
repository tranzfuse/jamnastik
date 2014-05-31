var redisClient = require('../src/js/redisClient');

module.exports = function(app) {
  app.get('/jam/:key', function (req, res) {
    redisClient.get(req.params.key, function(err, reply) {
      if (err) {
        console.log('REDIS Error', err);
        res.redirect('/');
      }
      res.send(reply.toString());
    });
  });
}
