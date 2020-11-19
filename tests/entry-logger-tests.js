'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var runner = require('./lib/runner');
var test = runner.test.bind(runner);

var createEntryLogger = require('../src/entry-logger');
runner.subject('createEntryLogger');

var fixtureLines = [
  'http://foo.com/1 : Some Title 1',
  'http://foo.com/2 : Some Title 2',
  'http://foo.com/3 : Some Title 3'
];
var fixtureData = fixtureLines.join('\n') + '\n';

var entry4 = { id: 'http://foo.com/4', title: 'Some Title 4' };
var entry5 = { id: 'http://foo.com/5', title: 'Some Title 5' };

var logger;
runner.beforeEach(function() {
  logger = createEntryLogger({
    directory: path.join(__dirname, 'tmp'),
    feedName: 'some-feed',
    lineLimit: 4,
    sync: true
  });

  logger.setUpWithData = function() {
    this.setUp();
    this.setData(fixtureData);
    this.dataChanged = true;
    return this;
  };
});

runner.afterEach(function() {
  try { fs.unlinkSync(logger.archiveFile()); } catch (e) {}
  fs.unlinkSync(logger.contextFile());
});


runner.subject('#logEntry');

test('logs entry to data if id is unique', function() {
  logger.setUpWithData();
  assert(logger.logEntry(entry4) !== false, 'is successful');
  assert(logger.logEntry(entry4) === false, 'fails uniqueness check');
  assert.equal(
    logger.data.indexOf(entry4.id),
    logger.data.lastIndexOf(entry4.id),
    'appends link only once'
  );
});

test('moves lines from top to archive when line-limit reached ', function() {
  logger.setUpWithData();
  assert(logger.logEntry(entry4) !== false, 'is successful');
  assert(logger.logEntry(entry5) !== false, 'is successful');
  assert.equal(logger.data.indexOf(fixtureLines[0]), -1, 'moves first line');
  assert.equal(logger.archiveBuffer.indexOf(fixtureLines[0]), 0, 'to archive');
});

test('works with no initial data', function() {
  logger.setUp();
  assert(logger.logEntry(entry4) !== false, 'is successful');
});


runner.subject('#setUp');

test('creates context file if none exist', function() {
  assert.doesNotThrow(function() {
    logger.setUp();
  });
  assert.equal(logger.data, '', 'sets data to blank');
});

test('loads data from context file', function() {
  logger.setUpWithData().tearDown();
  logger.setUp();
  assert.equal(logger.data, fixtureData, 'loads fixture data');
});


runner.subject('#tearDown');

test('flushes data into context file', function() {
  var addition = 'http://foo.com/4 : Some Title 4\n';
  logger.setUpWithData();
  logger.setData(logger.data + addition);
  logger.tearDown();
  assert.equal(logger.data, null, 'sets data to null');

  logger.setUp();
  assert.equal(logger.data, fixtureData + addition, 'file has data');
});

test('flushes archive buffer into end of archive file', function() {
  logger.setUpWithData();
  logger.logEntry(entry4);
  logger.logEntry(entry5);
  logger.tearDown();

  var archiveData = fs.readFileSync(logger.archiveFile(), 'utf8');
  assert.equal(archiveData, fixtureLines[0] +'\n', 'file has data');
});

runner.report();
