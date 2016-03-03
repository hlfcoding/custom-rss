var app = require('connect')();
var fs = require('fs');
var config = require('./config');

config.feeds.forEach(function(feed) {
  var middleware = require('./src/feeds/'+ feed.name);
  app.use('/'+ feed.name, middleware.bind(null, feed));
});

app.use(function(request, response) {
  response.statusCode = 404;
  fs.readFile(__dirname +'/404.shtml', function(error, data) {
    if (error) {
      response.end('Feed not found!\n');
    } else {
      response.setHeader('Content-Type', 'text/html');
      response.end(data);
    }
  });
});

require('http').createServer(app).listen(3000);
