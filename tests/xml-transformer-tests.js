var assert = require('assert');
var runner = require('./runner');
var test = runner.test;

var createXMLTransformer = require('../src/xml-transformer');

var transformer;
runner.beforeEach(function() {
  transformer = createXMLTransformer([
    '<root>\n',
    '\t<entry>\n\t\t<title>foo</title>\n\t</entry>\n',
    '\t<entry>\n\t\t<title>bar</title>\n\t</entry>\n',
    '\t<entry>\n\t\t<title>baz</title>\n\t</entry>\n',
    '</root>\n',
  ].join(''));
});

runner.subject('createXMLTransformer');

test('#find finds first tag content by tag name', function() {
  var title = transformer.find('title');
  assert(title === 'foo', 'expect correct title');
});

test('#next updates internal cursor to end of current match', function() {
  var oldCursor = transformer.cursor;
  transformer.find('title');
  transformer.next();
  assert(transformer.cursor > oldCursor, 'expected shifted cursor');
});

runner.report();
