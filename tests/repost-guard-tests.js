var assert = require('assert');
var path = require('path');
var runner = require('./lib/runner');
var test = runner.test.bind(runner);

var createRepostGuard = require('../src/repost-guard');
runner.subject('createRepostGuard');

var fixture = [
  'http://facebook.com',
  'http://google.com',
  'http://yahoo.com'
].join('\n');
var guard;
runner.beforeEach(function() {
  guard = createRepostGuard({
    directory: path.join(__dirname, 'tmp'),
    sync: true
  });

  guard.setUpWithData = function() {
    this.setUp();
    this.data = fixture;
  };

  guard.addStoreData = function() {
    guard.setUpWithData();
    guard.tearDown();
  };
});

runner.afterEach(function() {
  guard.removeStoreFile();
});


runner.subject('#setUp');

test('creates store file if none exist', function() {
  assert.doesNotThrow(function() {
    guard.setUp();
  });
  assert.equal(guard.data, '', 'sets data to blank');
});

test('loads data from store file', function() {
  guard.addStoreData();
  guard.setUp();
  assert.equal(guard.data, fixture, 'loads fixture data');
});


runner.subject('#tearDown');

test('flushes data into store file', function() {
  var addition = '\nhttp://twitter.com';
  guard.setUpWithData();
  guard.data += addition;
  guard.tearDown();
  assert.equal(guard.data, null, 'sets data to null');

  guard.setUp();
  assert.equal(guard.data, fixture + addition, 'loads fixture data');
});


runner.report();
