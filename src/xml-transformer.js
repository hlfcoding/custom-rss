var log = require('./util').log;
var rAttrs = {};
var rHasTag = /<\/.+?>/; // Check closing tag.
var rTags = {};

function lazyCreateAttrRegExp(tagName, attrName) {
  if (!rTags[attrName]) {
    var pattern = (
      // Start of tag, allows whitespace or breaks.
      '<'+ tagName +'[^]*?'+ attrName +'="' +
      // Content, lazy, allows whitespace and breaks.
      '([^]+?)' +
      // End of tag, allows whitespace or breaks.
      '"[^]*?>'
    );
    rAttrs[attrName] = new RegExp(pattern, 'i');
  }
  return rAttrs[attrName];
}

function lazyCreateTagRegExp(tagName) {
  if (!rTags[tagName]) {
    var pattern = (
      // Opening tag, allows whitespace and breaks.
      '<'+ tagName +'[^]*?>\\s*' + 
      // Content, lazy, allows whitespace and breaks.
      '([^]+?)' +
      // Closing tag, allows whitespace and breaks.
      '\\s*<\\/'+ tagName +'>'
    );
    rTags[tagName] = new RegExp(pattern, 'i');
  }
  return rTags[tagName];
}

module.exports = function createXMLTransformer(string) {
  return {
    content: function(raw) {
      var string = this.matchResults[1];
      if (rHasTag.test(string) && !raw) {
        this.lazyCreateChild(string);
        return this.child;
      }
      return string;
    },

    find: function(tagName, attrName) {
      var regExp = lazyCreateTagRegExp(tagName);
      var string = this.string.substring(this.cursor);
      var matchResults = string.match(regExp);

      if (attrName) {
        regExp = lazyCreateAttrRegExp(tagName, attrName);
        matchResults = string.match(regExp);
        return !matchResults ? null : matchResults[1];

      } else if (matchResults) {
        this.matchResults = matchResults;
        return this.content();
      }
    },

    next: function() {
      var mr, nextCursor;
      if ((mr = this.matchResults)) {
        nextCursor = this.cursor + mr.index + mr[0].length;
        if (nextCursor < this.string.length) {

          this.cursor = nextCursor;
          return true;
        }
      }
      return false;
    },

    skip: function() {
      this.replaceChildString('');
    },

    transformContent: function(tagName, args) {
      var string = this.find(tagName);
      if (typeof string !== 'string') {
        throw 'only replaces string';
      }
      args.from = args.from || string;

      this.replaceFromCursor(args.from, args.to);

      if (this.parent) {
        this.parent.replaceChildString();
      }
    },

    // Internal:

    child: null,
    cursor: 0,
    matchResults: null,
    originalString: string,
    parent: null,
    string: string,

    lazyCreateChild: function(string) {
      if (!this.child || this.child.string !== string) {
        if (this.child) {
          this.child.parent = null;
        }
        this.child = createXMLTransformer(string);
        this.child.parent = this;
      }
    },

    matchingTag: function(string) {
      if (string) { this.matchResults[0] = string; }
      return this.matchResults[0];
    },

    matchingContent: function(string) {
      if (string) { this.matchResults[1] = string; }
      return this.matchResults[1];
    },

    replaceFromCursor: function(pattern, replacement) {
      var rest = this.string.substring(0, this.cursor);
      var replaced = this.string.substring(this.cursor)
        .replace(pattern, replacement);
      this.string = rest + replaced;
    },

    replaceChildString: function(replacement) {
      if (typeof string !== 'string') {
        throw 'Replace can only occur on a string.';
      }
      var c = this.child;
      replacement = replacement || c.string;
      this.replaceFromCursor(c.originalString, replacement);
      this.matchingTag(
        this.matchingTag().replace(c.originalString, replacement)
      );

      c.originalString = c.string;
    }
  };
};
