var app = require('connect')();
var createRepostGuard = require('./src/repost-guard');
var fs = require('fs');
var log = require('./src/util').log;
var path = require('path');

// Keeping this forever in memory for now.
createRepostGuard.shared = createRepostGuard({
  directory: path.join(__dirname, 'tmp'),
  lineLimit: 5000, // ~350 links * 14 days
  // Number of most recent links discounted for being on current page.
  feedPageSize: 30,
  sync: false,
  onReady: function() { log('Links loaded.'); }
});
createRepostGuard.shared.setUp();

require('./config').feeds.forEach(function(feed) {
  var middleware = require(path.join(__dirname, 'src/feeds', feed.name));
  app.use('/'+ feed.name, middleware.bind(null, feed));
});

app.use(function(request, response) {
  response.statusCode = 404;
  fs.readFile(path.join(__dirname, '404.shtml'), function(error, data) {
    if (error) {
      response.end('Feed not found!\n');
    } else {
      response.setHeader('Content-Type', 'text/html');
      response.end(data);
    }
  });
});

require('http').createServer(app).listen(3000);
