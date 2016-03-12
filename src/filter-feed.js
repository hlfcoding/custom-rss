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

  var guard = createRepostGuard.shared;
  var entry, skip;
  while ((entry = root.find('entry'))) {

    if ((skip = delegate.shouldSkipEntry(entry, filters, guard)) &&
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
  // Wait for logger.
  delegate.logger = createEntryLogger({
    directory: directory,
    feedName: delegate.config.name,
    lineLimit: 500,
    sync: false,
    onReady: filterFeed.bind(null, delegate)
  });

  // Wait for feed.
  var onDone = delegate.onDone;
  delegate.onDone = function() {
    onDone.apply(delegate, arguments);
    createRepostGuard.shared.persistLinks(function() {
      util.log('Links persisted.');
    });
    delegate.logger.tearDown();
  };

  // Start.
  delegate.logger.setUp();
};
