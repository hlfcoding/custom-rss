var http = require('http');
var log = require('./util').log;

module.exports = function fetchFeed(delegate, verbose) {
  var request = http.request(delegate.url);

  request.on('error', function(e) {
    log(e.message);
    delegate.on.error(e);

  }).on('response', function(response) {
    log('status', response.statusCode);
    log('headers', JSON.stringify(response.headers));

    var data = '';
    response.setEncoding('utf8');
    response.on('data', function(chunk) {
      data += chunk; 
    }).on('end', function() {
      if (verbose) { log('data', data); }
      delegate.on.response(response, data);
    });
  });

  request.end();
};
