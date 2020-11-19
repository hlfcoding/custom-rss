'use strict';

var assert = require('assert');
var runner = require('./lib/runner');
var test = runner.test.bind(runner);

var filterFeed = require('../src/filter-feed');
runner.subject('filterFeed');

var fixtureFiltersConfig = [
  { name: 'foo', type: 'blacklist', tokens: ['Foo'] },
  { name: 'bar', type: 'blacklist', tokens: ['Bar'] },
  { name: 'baz', type: 'graylist', tokens: ['Baz'] }
];


var createFilters = filterFeed.createFilters;
runner.subject('.createFilters');

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
var mockFinders = {
  link: function(mockEntry) { return mockEntry.link; },
  title: function(mockEntry) { return mockEntry.title; }
};
var mockRepostGuard = {
  checkLink: function(link) { return link !== 'repost.com'; }
};
var defaultShouldSkipEntry = filterFeed.defaultShouldSkipEntry;
runner.subject('.defaultShouldSkipEntry');

test("returns 'blocked' reason for filtered posts", function() {
  var entryToBlock = { title: 'Some title with Foo', link: 'foo.com' };
  var skip = defaultShouldSkipEntry(entryToBlock, mockFinders, filters, mockRepostGuard);
  assert.equal(skip, 'blocked');
});

test("returns 'repost' reason for duplicate posts", function() {
  var entryToDedupe = { title: 'Some title', link: 'repost.com' };
  var skip = defaultShouldSkipEntry(entryToDedupe, mockFinders, filters, mockRepostGuard);
  assert.equal(skip, 'repost');
});

test('otherwise returns false', function() {
  var entryToKeep = { title: 'Some title', link: 'foo.com' };
  var skip = defaultShouldSkipEntry(entryToKeep, mockFinders, filters, mockRepostGuard);
  assert(!skip);
});

test('also returns false for questionable posts, tags title ', function() {
  var entryToKeep = { title: 'Some title with Baz', link: 'baz.com',
    transformContent: function(tagName, args) {
      assert.equal(tagName, 'title');
      this.title = args.to();
    }
  };
  var skip = defaultShouldSkipEntry(entryToKeep, mockFinders, filters, mockRepostGuard);
  assert(!skip);
  assert.equal(entryToKeep.title.indexOf('[baz] '), 0);
});


runner.report();
