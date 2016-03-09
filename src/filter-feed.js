var createEntryLogger = require('./entry-logger');
var createRepostGuard = require('./repost-guard');
var createXMLTransformer = require('./xml-transformer');
var util = require('./util');

var directory = require('path').join(__dirname, '../tmp');

function createFilters(configs) {
  return configs.map(function(config) {
    var filter = { name: config.name };
    if (config.type === 'blacklist') {
      filter.pattern = util.patterns.createFromTokens(config.tokens);
    }
    return filter;
  });
}

function filterFeed(delegate) {
  var filters = createFilters(delegate.config.filters);

  var root = createXMLTransformer({ string: delegate.data, verbose: delegate.verbose });
  delegate.transformMeta(root);

  var entry, skip;
  while ((entry = root.find('entry'))) {

    if ((skip = delegate.shouldSkipEntry(entry, filters, delegate.guard)) &&
        skip !== false)
    {
      root.skip();
      delegate.logger.logEntry({
        id: delegate.findId(entry),
        title: delegate.findTitle(entry) +' ('+ skip +')'
      });

    } else {
      delegate.transformEntry(entry);
      root.next();
    }

  }
  delegate.onDone(root.string);
}

module.exports = function(delegate) {
  // Wait for guard, logger.
  var deferredFilterFeed = util.callOn(2, filterFeed.bind(null, delegate));
  delegate.guard = createRepostGuard({
    directory: directory,
    lineLimit: 5000, // ~350 links * 14 days
    // Number of most recent links discounted for being on current page.
    feedPageSize: 30,
    sync: false,
    onReady: deferredFilterFeed
  });
  delegate.logger = createEntryLogger({
    directory: directory,
    feedName: delegate.config.name,
    lineLimit: 500,
    sync: false,
    onReady: deferredFilterFeed
  });

  // Wait for feed.
  var onDone = delegate.onDone;
  delegate.onDone = function() {
    onDone.apply(delegate, arguments);
    delegate.guard.tearDown();
    delegate.logger.tearDown();
  };

  // Start.
  delegate.guard.setUp();
  delegate.logger.setUp();
};
