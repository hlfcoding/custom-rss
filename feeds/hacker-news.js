const fetchFeed = require('../fetch-feed');
const url = 'http://hnapp.com/rss?q=' + 
  '-type%3Acomment%20-type%3Aask%20-type%3Ashow%20-type%3Ajob%20' +
  '-host%3Aqz.com%20-host%3Ayahoo.com';

module.exports = (request, response) => {
  fetchFeed({ url,
    on: {
      response(r, data) {
        response.setHeader('Content-Type', r.headers['content-type']);
        response.end(data);
      },
      error(e) {
        response.end(e.message);
      }
    }
  });
};
