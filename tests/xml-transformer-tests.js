var assert = require('assert');
var runner = require('./runner');
var test = runner.test.bind(runner);

var createXMLTransformer = require('../src/xml-transformer');

runner.subject('createXMLTransformer');

var root;
runner.beforeEach(function() {
  root = createXMLTransformer({ string: [
    '<root>\n',
    '\t<entry rel-src="/foo.html">\n\t\t<title>foo</title>\n\t</entry>\n',
    '\t<entry rel-src="/bar.html">\n\t\t<title>bar</title>\n\t</entry>\n',
    '\t<entry rel-src="/baz.html">\n\t\t<title>baz</title>\n\t</entry>\n',
    '</root>\n',
  ].join('') });

  root.findNext = function() {
    this.next();
    return this.find.apply(this, arguments);
  };
});


runner.subject('#find');

test('returns first tag content by tag name', function() {
  var title = root.find('title');
  assert.equal(title , 'foo', 'returns correct tag content');
  assert.equal(root.content() , title, '#content returns same content');
});

test('returns first attribute content by tag, attribute names', function() {
  var entry = root.find('entry');
  var relSrc = root.find('entry', 'rel-src');
  assert.equal(relSrc , '/foo.html', 'returns correct attribute content');
  assert.equal(root.content() , entry, '#content returns tag transformer');
});

test('returns child transformer if content is another tag', function() {
  var entry = root.find('entry');
  assert.equal(entry.creator, createXMLTransformer, 'returns transformer');
  assert.equal(root.content(), entry, '#content returns same instance');
  assert.equal(root.find('entry'), entry, 're-find returns same instance');
});


runner.subject('#next');

test('updates internal cursor to end of current match', function() {
  var oldCursor = root.cursor;
  root.find('title');
  assert(root.next(), 'returns bool for success');
  assert(root.cursor > oldCursor, 'shifts cursor');
});

test('fails when end of string is reached', function() {
  assert.equal(root.find('title'), 'foo');
  assert.equal(root.findNext('title'), 'bar');
  assert.equal(root.findNext('title'), 'baz');
  assert(root.next(), 'moves to end of string');
  var oldCursor = root.cursor;
  assert(!root.next(), 'returns bool for failure');
  assert.equal(root.cursor, oldCursor, 'cursor stays still');
});


runner.subject('#skip');

test('removes current match from string', function() {
  root.find('entry');
  root.skip();
  assert.equal(root.find('title'), 'bar', 'now starts with second entry');
});


runner.subject('#transformContent');

test("transforms tag content based on 'from' and 'to' patterns", function() {
  root.transformContent('title', { from: /f(oo)/, to: 'b$1' });
  assert.equal(root.find('title'), 'boo', 'partially replaces content');

  root.transformContent('title', { to: '$& boo' });
  assert.equal(root.find('title'), 'boo boo', "defaults 'from' to full content");
});

test('transforms content of successive tags reliably', function() {
  root.transformContent('title', { to: '$& (foo)' }).next();
  root.transformContent('title', { to: '$& (bar)' }).next();
  root.transformContent('title', { to: '$& (baz)' });
  root.cursor = 0;
  assert.equal(root.find('title'), 'foo (foo)', 'content remains as intended');
});

test('causes parent tag(s) to sync and update their strings', function() {
  var entry = root.find('entry');
  entry.transformContent('title', { to: 'new' });
  assert.equal(root.find('title'), 'new', 'parent transformer updates');
});


runner.report();
