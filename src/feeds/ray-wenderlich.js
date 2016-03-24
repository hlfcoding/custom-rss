var fetchFeed = require('../fetch-feed');
var filterFeed = require('../filter-feed');
var url = require('url');

function transformMeta(root) {
  root.transformContent('title', { to: 'Ray Wenderlich (filtered)' });
}

module.exports = function(config, request, response) {
  config.originalURL = 'https://www.raywenderlich.com/feed?max-results=1';
  config.url = url.format({
    protocol: 'http', host: request.headers.host, pathname: config.name
  });

  fetchFeed({
    url: config.originalURL,
    onResponse: function(resFetch, data) {
      response.setHeader('Content-Type', resFetch.headers['content-type']);

      filterFeed({
        config: config,
        data: data,
        findEntry: function(root) { return root.find('item'); },
        findId: function(entry) { return entry.find('guid'); },
        guardReposts: false,
        transformMeta: transformMeta,
        verbose: true,
        onDone: function(data) {
          response.end(data);
        }
      });
    },
    onError: function(e) {
      response.end(e.message);
    }
  });
};
