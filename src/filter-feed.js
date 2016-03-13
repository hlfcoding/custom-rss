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

var defaultFinders = {
  entry: function(root) { return root.find('entry'); },
  link: function(entry) { return entry.find('link'); },
  title: function(entry) { return entry.find('title'); }
};

function defaultShouldSkipEntry(entry, finders, filters, repostGuard) {
  var title = finders.title(entry);
  var skip = filters.reduce(function(skip, filter) {
    return skip || filter.pattern.test(title);
  }, false);
  if (skip) { skip = 'blocked'; }

  var link = finders.link(entry);
  if (skip === false) {
    skip = !repostGuard.checkLink(link);
    if (skip) { skip = 'repost'; }
  }

  return skip;
}

function filterFeed(delegate) {
  var filters = createFilters(delegate.config.filters);

  var root = createXMLTransformer({
    string: delegate.data, verbose: delegate.verbose
  });
  delegate.transformMeta(root);

  var finders = {
    entry: delegate.findEntry || defaultFinders.entry,
    id: delegate.findId,
    link: delegate.findLink || defaultFinders.link,
    title: delegate.findTitle || defaultFinders.title
  };
  var guard = createRepostGuard.shared;
  var shouldSkipEntry = delegate.shouldSkipEntry || defaultShouldSkipEntry;

  var entry, skip;
  while ((entry = finders.entry(root))) {

    if (delegate.guardReposts !== false &&
        (skip = shouldSkipEntry(entry, finders, filters, guard)) &&
        skip !== false)
    {
      root.skip();
      delegate.logger.logEntry({
        id: finders.id(entry),
        title: finders.title(entry) +' ('+ skip +')'
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
