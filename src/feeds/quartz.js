var fetchFeed = require('../fetch-feed');
var filterFeed = require('../filter-feed');
var patterns = require('../util').patterns;

function transformMeta(root) {
  root.transformContent('title', { to: 'Quartz (filtered)' });
}

module.exports = function(config, request, response) {
  fetchFeed({
    url: 'http://qz.com/feed/',
    onResponse: function(resFetch, data) {
      response.setHeader('Content-Type', resFetch.headers['content-type']);
      filterFeed({
        config: config,
        data: data,
        findEntry: function(root) { return root.find('item'); },
        findId: function(entry) { return entry.find('guid'); },
        transformEntry: function() {},
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
