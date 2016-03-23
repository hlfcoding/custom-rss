var assert = require('assert');
var runner = require('./lib/runner');
var test = runner.test.bind(runner);

var util = require('../src/util');
runner.subject('util');


runner.subject('normalizeLink');

test('returns only host and pathname', function() {
  var link = 'http://some-domain.com/some-path?some-query#some-fragment';
  assert.equal(util.normalizeLink(link), 'some-domain.com/some-path');
});

test("does not include 'www'", function() {
  assert.equal(util.normalizeLink('http://www.some-domain.com/'), 'some-domain.com/');
});


runner.report();
