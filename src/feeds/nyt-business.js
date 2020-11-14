'use strict';

var fetchFeed = require('../fetch-feed');
var filterFeed = require('../filter-feed');
var url = require('url');

function transformLink(entry) {
  // Replace with actual article link, instead of redirect.
  entry.transformContent('link', { to: entry.find('guid') });
}

function transformMeta(root) {
  root.transformContent('title', { to: 'NYT Business (filtered)' });
}

module.exports = function(config, request, response) {
  config.originalURL = 'http://www.nytimes.com/services/xml/rss/nyt/Business.xml';
  config.url = url.format({
    protocol: 'http', host: request.headers.host, pathname: config.name
  });

  fetchFeed({
    url: 'http://rss.nytimes.com/services/xml/rss/nyt/Business.xml',
    onResponse: function(resFetch, data) {
      response.setHeader('Content-Type', resFetch.headers['content-type']);

      filterFeed({
        config: config,
        data: data,
        findEntry: function(root) { return root.find('item'); },
        findId: function(entry) { return entry.find('guid'); },
        guardReposts: false,
        transformEntry: transformLink,
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
