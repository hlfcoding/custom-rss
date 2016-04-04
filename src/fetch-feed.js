var util = require('./util');

module.exports = function fetchFeed(delegate) {
  // delegate.url: a url string
  // delegate.verbose: a bool
  // delegate.onError: an error handler
  // delegate.onResponse: a response and data handler

  var request = util.request(delegate.url);

  request.on('error', function(e) {
    util.log(e.message);
    delegate.onError(e);
  });

  request.on('response', function(response) {
    util.log('status', response.statusCode);
    util.log('headers', JSON.stringify(response.headers));

    var data = '';
    response.setEncoding('utf8');
    response.on('data', function(chunk) {
      data += chunk; 
    }).on('end', function() {
      if (delegate.verbose) { util.log('data', data); }
      delegate.onResponse(response, data);
    });
  });

  request.end();
};
