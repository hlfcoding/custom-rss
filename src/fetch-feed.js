var http = require('http');
var log = require('./util').log;

module.exports = function fetchFeed(delegate) {
  var request = http.request(delegate.url);

  request.on('error', function(e) {
    log(e.message);
    delegate.onError(e);

  }).on('response', function(response) {
    log('status', response.statusCode);
    log('headers', JSON.stringify(response.headers));

    var data = '';
    response.setEncoding('utf8');
    response.on('data', function(chunk) {
      data += chunk; 
    }).on('end', function() {
      if (delegate.verbose) { log('data', data); }
      delegate.onResponse(response, data);
    });
  });

  request.end();
};
