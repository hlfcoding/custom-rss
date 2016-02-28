var fetchFeed = require('../fetch-feed');
var url = 'http://hnapp.com/rss?q=' + 
  '-type%3Acomment%20-type%3Aask%20-type%3Ashow%20-type%3Ajob%20' +
  '-host%3Aqz.com%20-host%3Ayahoo.com';

module.exports = function(request, response) {
  fetchFeed({
    url: url,
    on: {
      response: function(r, data) {
        response.setHeader('Content-Type', r.headers['content-type']);
        response.end(data);
      },
      error: function(e) {
        response.end(e.message);
      }
    }
  });
};
