var fetchFeed = require('../fetch-feed');
var createXMLTransformer = require('../xml-transformer');
var log = require('../util').log;
var patterns = require('../util').patterns;
var track = require('../util').track;

var rScorePrefix = /^\d+\s+\S+\s+/;
var rUninterestingTopics = patterns.createFromTokens([
  // Technical.
  '#C', '\\.NET', 'Angular', 'BEM', 'DuckDuckGo', 'Java', 'Kotlin',
  'Lua', 'MatLab', 'OCAML', 'Perl', 'R', 'Raspberry Pi', 'Rust',
  'Surface Pro', 'Xamarin',
  // Timely.
  'Trump', 'Bernie', 'Hillary'
]);

var url = 'http://hnapp.com/rss?q=' +
  'score>1%20%7C%20comments>1%20' + 
  '-type%3Acomment%20-type%3Aask%20-type%3Ashow%20-type%3Ajob%20' +
  '-host%3Aqz.com%20-host%3Ayahoo.com';

function createDomainSuffix(entry) {
  var link = entry.find('link', 'href') || '';
  return (!link.length ? '' : ' ('+link.match(patterns.domain)[1]+')');
}

function filterFeed(string, verbose) {
  var root = createXMLTransformer(string);
  transformMeta(root);

  var skipped = [];
  var entry, isNoise, title;
  while ((entry = root.find('entry'))) {
    title = entry.find('title');
    log('cursor', root.cursor);

    if (shouldSkipEntry(entry, { title: title })) {
      root.skip();
      skipped.push(title);
    } else {
      transformTitle(entry);
    }
    root.next();

    log('entry', (verbose ? entry.string : entry.string.length));
  }
  track('Skipped '+ skipped.length +' for Hacker News\n'+ skipped.join('\n'));

  return root.string;
}

function shouldSkipEntry(entry, criteria) {
  return rUninterestingTopics.test(criteria.title);
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

module.exports = function(request, response) {
  fetchFeed({
    url: url,
    onResponse: function(r, data) {
      response.setHeader('Content-Type', r.headers['content-type']);
      response.end(filterFeed(data));
    },
    onError: function(e) {
      response.end(e.message);
    }
  });
};
