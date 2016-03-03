var createXMLTransformer = require('./xml-transformer');
var log = require('./util').log;
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

module.exports = function filterFeed(delegate) {
  var filters = createFilters(delegate.config.filters);

  var root = createXMLTransformer(delegate.data);
  delegate.transformMeta(root);

  var skipped = [];
  var entry;
  while ((entry = root.find('entry'))) {
    log('cursor', root.cursor);

    if (delegate.shouldSkipEntry(filters, entry)) {
      root.skip();
      skipped.push(entry.find('link'));
    } else {
      delegate.transformEntry(entry);
    }
    root.next();

    log('entry', (delegate.verbose ? entry.string : entry.string.length));
  }
  track('Skipped '+ skipped.length +' for '+ delegate.config.name +'\n'+
    skipped.join('\n'));

  return root.string;
};