var assert = require('assert');
var runner = require('./lib/runner');
var test = runner.test.bind(runner);

var filterFeed = require('../src/filter-feed');
runner.subject('filterFeed');

var fixtureFiltersConfig = [
  { name: 'foo', type: 'blacklist', tokens: ['Foo'] },
  { name: 'bar', type: 'blacklist', tokens: ['Bar'] }
];


var createFilters = filterFeed.createFilters;
runner.subject('createFilters');

test('creates filters from configs', function() {
  var filters = createFilters(fixtureFiltersConfig);

  assert.equal(filters[0].name, 'foo');
  assert(filters[0].pattern.test('Some title with Foo'));
  assert(!filters[0].pattern.test('Some title with Bar'));

  assert.equal(filters[1].name, 'bar');
  assert(filters[1].pattern.test('Some title with Bar'));
  assert(!filters[1].pattern.test('Some title with Foo'));
});


var filters = createFilters(fixtureFiltersConfig);
var finders = {
  link: function(entry) { return entry.link; },
  title: function(entry) { return entry.title; }
};
var repostGuard = {
  checkLink: function(link) { return link !== 'repost.com'; }
};
var defaultShouldSkipEntry = filterFeed.defaultShouldSkipEntry;
runner.subject('defaultShouldSkipEntry');

test("returns 'blocked' reason for filtered posts", function() {
  var entryToBlock = { title: 'Some title with Foo', link: 'foo.com' };
  var skip = defaultShouldSkipEntry(entryToBlock, finders, filters, repostGuard);
  assert.equal(skip, 'blocked');
});

test("returns 'repost' reason for duplicate posts", function() {
  var entryToDedupe = { title: 'Some title', link: 'repost.com' };
  var skip = defaultShouldSkipEntry(entryToDedupe, finders, filters, repostGuard);
  assert.equal(skip, 'repost');
});

test('otherwise returns false', function() {
  var entryToKeep = { title: 'Some title', link: 'foo.com' };
  var skip = defaultShouldSkipEntry(entryToKeep, finders, filters, repostGuard);
  assert(!skip);
});


runner.report();
