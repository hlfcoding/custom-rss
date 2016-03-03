var fetchFeed = require('../fetch-feed');
var filterFeed = require('../filter-feed');
var patterns = require('../util').patterns;

var rScorePrefix = /^\d+\s+\S+\s+/;

function createDomainSuffix(entry) {
  var link = entry.find('link', 'href') || '';
  return (!link.length ? '' : ' ('+link.match(patterns.domain)[1]+')');
}

function shouldSkipEntry(filters, entry) {
  var title = entry.find('title');
  return filters.reduce(function(skip, filter) {
    return skip || filter.pattern.test(title);
  }, false);
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
      data = filterFeed({
        config: config,
        data: data,
        shouldSkipEntry: shouldSkipEntry,
        transformMeta: transformMeta,
        transformEntry: transformTitle
      });
      response.end(data);
    },
    onError: function(e) {
      response.end(e.message);
    }
  });
};
