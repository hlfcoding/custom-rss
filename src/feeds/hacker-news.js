var fetchFeed = require('../fetch-feed');
var filterFeed = require('../filter-feed');
var patterns = require('../util').patterns;

var rScorePrefix = /^\d+\s+\S+\s+/;

function createDomainSuffix(entry) {
  var link = entry.find('link', 'href') || '';
  return (!link.length ? '' : ' ('+link.match(patterns.domain)[1]+')');
}

function transformMeta(root) {
  root.transformContent('title', { to: 'Hacker News (filtered)' });
}

function transformTitle(entry) {
  function replace(match) {
    // No score.
    var replaced = match.replace(rScorePrefix, '');
    // Add domain if any.
    replaced += createDomainSuffix(entry);
    return replaced;
  }
  entry.transformContent('title', { to: replace });
}

module.exports = function(config, request, response) {
  fetchFeed({
    url: 'http://hnapp.com/rss?q='+ config.hnappQuery,
    onResponse: function(resFetch, data) {
      response.setHeader('Content-Type', resFetch.headers['content-type']);
      filterFeed({
        config: config,
        data: data,
        findId: function(entry) { return entry.find('id'); },
        findLink: function(entry) { return entry.find('link', 'href'); },
        transformEntry: transformTitle,
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
