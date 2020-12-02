'use strict';

var fetchFeed = require('../fetch-feed');
var filterFeed = require('../filter-feed');
var patterns = require('../util').patterns;
var url = require('url');

var rCommentsURL = /news.ycombinator.com\/item\?id=/;
var rCounts = /(\d+)\s(?:point|comment)s?/g;
var rScorePrefix = /^(\[\w+\]\s)?\d+\s+\S+\s+/;

function createSuffix(entry) {
  var suffix = ' [';
  var counts = entry.find('content').match(rCounts) || [];
  suffix += counts.map(function(s) { return parseInt(s); }).join('|');
  var link = entry.find('link', 'href') || '';
  suffix += (!link.length ? '' : '|'+link.match(patterns.domain)[1]);
  return suffix+']';
}

function transformContent(entry) {
  function replace(match) {
    var replaced = match.replace(rCommentsURL, 'hn.premii.com/#/comments/');
    return replaced;
  }
  entry.transformContent('content', { to: replace });
}

function transformMeta(root) {
  root.transformContent('title', { to: 'Hacker News (filtered)' });
}

function transformTitle(entry) {
  function replace(match) {
    // No score.
    var replaced = match.replace(rScorePrefix, '$1');
    // Add domain if any.
    replaced += createSuffix(entry);
    return replaced;
  }
  entry.transformContent('title', { to: replace });
}

module.exports = function(config, request, response) {
  config.originalURL = 'http://hnapp.com/rss?q='+ config.hnappQuery;
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
        findId: function(entry) { return entry.find('id'); },
        findLink: function(entry) { return entry.find('link', 'href'); },
        transformEntry: function(entry) {
          transformTitle(entry);
          transformContent(entry);
        },
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
