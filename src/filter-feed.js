var createEntryLogger = require('./entry-logger');
var createRepostGuard = require('./repost-guard');
var createXMLTransformer = require('./xml-transformer');
var util = require('./util');
var patterns = util.patterns;

var directory = require('path').join(__dirname, '../tmp');

function createFilters(configs) {
  return configs.map(function(config) {
    var filter = { name: config.name, input: config.input || 'title' };
    switch (config.type) {
      case 'blacklist':
        filter.pattern = patterns.createFromTokens(config.tokens); break;
      case 'black-pattern':
        filter.pattern = new RegExp(config.pattern); break;
      default: throw 'unsupported filter type';
    }
    return filter;
  });
}

var defaultFinders = {
  entry: function(root) { return root.find('entry'); },

  content: function(entry) { return entry.find('content'); },
  link: function(entry) { return entry.find('link'); },
  title: function(entry) { return entry.find('title'); }
};

function defaultShouldSkipEntry(entry, finders, filters, repostGuard) {
  var text, title;
  var skip = filters.reduce(function(skip, filter) {
    var input;
    switch (filter.input) {
      case 'text-content':
        if (!text) { text = patterns.stripTags(finders.content(entry)); }
        input = text;
        break;
      case 'title':
        if (!title) { title = finders.title(entry); }
        input = title;
        break;
      default: throw 'unsupported input type';
    }
    return skip || filter.pattern.test(input);
  }, false);
  if (skip) { skip = 'blocked'; }

  var link = finders.link(entry);
  if (repostGuard && skip === false) {
    skip = !repostGuard.checkLink(link);
    if (skip) { skip = 'repost'; }
  }

  return skip;
}

function mergeFinders(delegate) {
  return {
    entry: delegate.findEntry || defaultFinders.entry,

    content: delegate.findContent || defaultFinders.content,
    id: delegate.findId,
    link: delegate.findLink || defaultFinders.link,
    title: delegate.findTitle || defaultFinders.title
  };
}


function main(delegate) {
  // delegate.config.filters: an array of filter objects for createFilters
  // delegate.data: an xml string
  // delegate.findId: a function returning id string for xml-transformer 'entry'
  // delegate.find(Entry|Link|Title): optional functions return data for xml-transformer 'entry'
  // delegate.guardReposts: a bool
  // delegate.logger: a logger whose 'logEntry' takes a dictionary
  // delegate.shouldSkipEntry:
  // delegate.transform(Entry|Meta): optional transform functions that mutate given xml-transformer's 'string'

  var filters = createFilters(delegate.config.filters);

  var root = createXMLTransformer({
    string: delegate.data, verbose: delegate.verbose
  });
  if (delegate.transformMeta) {
    delegate.transformMeta(root);
  }

  var finders = mergeFinders(delegate);
  var guard;
  if (delegate.guardReposts !== false) {
    guard = createRepostGuard.shared;
  }
  var shouldSkipEntry = delegate.shouldSkipEntry || defaultShouldSkipEntry;

  var entry, skip;
  while ((entry = finders.entry(root))) {

    if ((skip = shouldSkipEntry(entry, finders, filters, guard)) &&
        skip !== false)
    {
      root.skip();
      delegate.logger.logEntry({
        id: finders.id(entry),
        title: finders.title(entry) +' ('+ skip +')'
      });

    } else {
      if (delegate.transformEntry) {
        delegate.transformEntry(entry);
      }
      root.next();
    }

  }
  delegate.onDone(root.string);
}

function filterFeed(delegate) {
  // Remove any XML stylesheets; we won't be serving them.
  delegate.data = delegate.data.replace(/<\?xml-stylesheet[^]+?\?>\s*/g, '');

  // Update URL values in feed.
  delegate.data = delegate.data.split(delegate.config.originalURL)
    .join(delegate.config.url);

  // Wait for logger.
  delegate.logger = createEntryLogger({
    directory: directory,
    feedName: delegate.config.name,
    lineLimit: 500,
    sync: false,
    onReady: main.bind(null, delegate)
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
}

filterFeed.createFilters = createFilters;
filterFeed.defaultShouldSkipEntry = defaultShouldSkipEntry;

module.exports = filterFeed;
