const http = require('http');
const log = require('./util').log;

module.exports = function fetchFeed(delegate) {
  let request = http.request(delegate.url);

  request.on('error', (e) => {
    log(e.message);
    delegate.on.error(e);
  });

  request.on('response', (response) => {
    log(`STATUS: ${response.statusCode}`);
    log(`HEADERS: ${JSON.stringify(response.headers)}`);

    let data = '';
    response.setEncoding('utf8');
    response.on('data', (chunk) => data += chunk);
    response.on('end', () => {
      log(`DATA: ${data}`);
      delegate.on.response(response, data);
    });
  });

  request.end();
};
