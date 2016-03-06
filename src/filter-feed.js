var createRepostGuard = require('./repost-guard');
var createXMLTransformer = require('./xml-transformer');
var log = require('./util').log;
var path = require('path');
var patterns = require('./util').patterns;
var track = require('./util').track;

function createFilters(configs) {
  return configs.map(function(config) {
    var filter = { name: config.name };
    if (config.type === 'blacklist') {
      filter.pattern = patterns.createFromTokens(config.tokens);
    }
    return filter;
  });
}

function filterFeed(delegate) {
  var filters = createFilters(delegate.config.filters);

  var root = createXMLTransformer({ string: delegate.data, verbose: delegate.verbose });
  delegate.transformMeta(root);

  var skipped = [];
  var entry;
  while ((entry = root.find('entry'))) {
    if (delegate.shouldSkipEntry(entry, filters, delegate.guard)) {
      root.skip();
      skipped.push(delegate.findLink(entry));
    } else {
      delegate.transformEntry(entry);
      root.next();
    }
  }
  track('skipped', skipped.length, 'for', delegate.config.name, '\n',
    skipped.join('\n'));

  delegate.onDone(root.string);
}

module.exports = function(delegate) {
  delegate.guard = createRepostGuard({
    directory: path.join(__dirname, '../tmp'),
    lineLimit: 5000, // ~350 links * 14 days
    // Number of most recent links discounted for being on current page.
    feedPageSize: 30,
    sync: false,
    // Wait for guard.
    onReady: filterFeed.bind(null, delegate)
  });

  // Wait for feed.
  var onDone = delegate.onDone;
  delegate.onDone = function() {
    onDone.apply(delegate, arguments);
    delegate.guard.tearDown();
  };

  // Start.
  delegate.guard.setUp();
};
