var assert = require('assert');
var runner = require('./lib/runner');
var test = runner.test.bind(runner);

var util = require('../src/util');
runner.subject('util');


runner.subject('stripTags');

test('decodes then strips tags', function() {
  var html = '&lt;p&gt;1 point, &lt;a href=&quot;https://news.ycombinator.com/item?id=12024279&quot;&gt;0 comments&lt;/a&gt;&lt;/p&gt;';
  assert.equal(util.patterns.stripTags(html), '1 point, 0 comments');
});


runner.subject('normalizeLink');

test('returns only host and pathname', function() {
  var link = 'http://some-domain.com/some-path?some-query#some-fragment';
  assert.equal(util.normalizeLink(link), 'some-domain.com/some-path');
});

test("does not include 'www'", function() {
  assert.equal(util.normalizeLink('http://www.some-domain.com/'), 'some-domain.com/');
});


runner.subject('callOn');

test('returns function that calls original on nth call', function() {
  var calls = 0;
  function fn() { calls += 1; }
  var deferredFn = util.callOn(2, fn);
  deferredFn();
  assert.equal(calls, 0, 'not yet called');
  deferredFn();
  assert.equal(calls, 1, 'called');
  deferredFn();
  assert.equal(calls, 2, 'subsequent calls pass through');
});


(function() {
  var string = 'first line\nsecond line\nthird line\n';

  runner.subject('nthIndexOf');

  test('returns nth index of search value', function() {
    assert.equal(util.nthIndexOf(string, '\n', 2), 22);
    assert.equal(util.nthIndexOf(string, 'f', 1), 0, 'handles edge cases');
  });

  test("returns '-1' if not found, like indexOf", function() {
    assert.equal(util.nthIndexOf(string, '\n', 4), -1, 'not found if out of bounds');
    assert.equal(util.nthIndexOf(string, '1', 1), -1, 'not found if true');
  });

  runner.subject('nthLastIndexOf');

  test('returns nth last index of search value', function() {
    assert.equal(util.nthLastIndexOf(string, '\n', 2), 22);
  });

  test("returns '-1' if not found, like lastIndexOf", function() {
    assert.equal(util.nthLastIndexOf(string, '\n', 4), -1, 'not found if out of bounds');
    assert.equal(util.nthLastIndexOf(string, '1', 1), -1, 'not found if true');
  });
}());


runner.report();
