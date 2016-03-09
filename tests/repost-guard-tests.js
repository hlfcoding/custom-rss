var assert = require('assert');
var fs = require('fs');
var path = require('path');
var runner = require('./lib/runner');
var test = runner.test.bind(runner);

var createRepostGuard = require('../src/repost-guard');
runner.subject('createRepostGuard');

var fixtureLines = [
  'medium.com/some-user/some-post',
  'google.com/some-page',
  'yahoo.com/some-page'
];
var fixtureData = fixtureLines.join('\n') + '\n';
var guard;
runner.beforeEach(function() {
  guard = createRepostGuard({
    directory: path.join(__dirname, 'tmp'),
    feedPageSize: 2,
    lineLimit: 4,
    sync: true
  });

  guard.setUpWithData = function() {
    this.setUp();
    this.setData(fixtureData);
    this.dataChanged = true;
    return this;
  };
});

runner.afterEach(function() {
  fs.unlinkSync(guard.storeFile());
});


runner.subject('#checkLink');

test('adds normalized link to data if unique', function() {
  guard.setUpWithData();
  assert(guard.checkLink('http://twitter.com/me?q=1#id'), 'unique');
  assert(guard.checkLink('http://twitter.com/me?q=1#id'), 'still in page');
  assert.equal(
    guard.data.indexOf('twitter.com/me\n'),
    guard.data.lastIndexOf('twitter.com/me\n'),
    'appends link only once'
  );
});

test("any existing link outside of 'current page' is a repost", function() {
  guard.setUpWithData();
  assert(guard.checkLink('http://twitter.com/me?q=1#id'), 'unique');
  assert(guard.checkLink('http://twitter.com/me?q=1#id'), 'still in page');
  assert(guard.checkLink('http://vine.co/playlists/foo'), 'unique');
  assert(!guard.checkLink('http://twitter.com/me?q=1#id'), 'repost');
});

test('removes lines from top when line-limit reached ', function() {
  guard.setUpWithData();
  assert(guard.checkLink('http://twitter.com/hashtag/foo'), 'returns success');
  assert(guard.checkLink('http://vine.co/playlists/foo'), 'returns success');
  assert.equal(guard.data.indexOf(fixtureLines[0]), -1, 'removes first link');
});

test('works with no initial data', function() {
  guard.setUp();
  assert(guard.checkLink('http://twitter.com/me?q=1#id'), 'returns success');
});


runner.subject('#setUp');

test('creates store file if none exist', function() {
  assert.doesNotThrow(function() { guard.setUp(); });
  assert.equal(guard.data, '', 'sets data to blank');
});

test('loads data from store file', function() {
  guard.setUpWithData().tearDown();
  guard.setUp();
  assert.equal(guard.data, fixtureData, 'loads fixture data');
});


runner.subject('#tearDown');

test('flushes data into store file', function() {
  var addition = 'twitter.com/hashtag/foo\n';
  guard.setUpWithData();
  guard.setData(guard.data + addition);
  guard.tearDown();
  assert.equal(guard.data, null, 'sets data to null');

  guard.setUp();
  assert.equal(guard.data, fixtureData + addition, 'file has data');
});


runner.report();
