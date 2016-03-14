var fetchFeed = require('../fetch-feed');
var filterFeed = require('../filter-feed');
var patterns = require('../util').patterns;

function transformMeta(root) {
  root.transformContent('title', { to: 'Yahoo Tech (filtered)' });
}

module.exports = function(config, request, response) {
  fetchFeed({
    url: 'https://www.yahoo.com/tech/rss',
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
