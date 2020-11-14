'use strict';

var log = require('./util').log;
var rAttrs = {};
var rHasTag = /<\/.+?>/; // Check closing tag.
var rTags = {};

function lazyCreateAttrRegExp(tagName, attrName) {
  if (!rTags[attrName]) {
    var pattern = (
      // Start of tag, allows whitespace or breaks.
      '\s*<'+ tagName +'[^]*?'+ attrName +'="' +
      // Content, lazy, allows whitespace and breaks.
      '([^]+?)' +
      // End of tag, allows whitespace or breaks.
      '"[^]*?>\s*'
    );
    rAttrs[attrName] = new RegExp(pattern, 'i', 'm');
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

module.exports = function createXMLTransformer(delegate) {
  // delegate.string: an xml string
  // delegate.verbose: a bool
  return {
    creator: createXMLTransformer,

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
      var string = this.scope();
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
          if (delegate.verbose) {
            log('next', this.cursor, this.scope().substr(0, 300));
          }
          return true;
        }
      }
      return false;
    },

    skip: function() {
      this.replaceFromCursor(this.matchingTag(), '');

      if (this.parent) {
        this.parent.replaceChildString();
      }
    },

    transformContent: function(tagName, args) {
      var string = this.find(tagName);
      if (typeof string !== 'string') {
        throw 'only replaces string';
      }
      args.from = args.from || string;
      if (delegate.verbose) {
        log('transform', tagName, args.from, args.to);
      }

      this.replaceFromCursor(args.from, args.to);

      if (this.parent) {
        this.parent.replaceChildString();
      }

      return this;
    },

    // Internal:

    child: null,
    cursor: 0,
    matchResults: null,
    originalString: delegate.string,
    parent: null,
    string: delegate.string,

    lazyCreateChild: function(string) {
      if (!this.child || this.child.string !== string) {
        if (this.child) {
          this.child.parent = null;
        }
        this.child = createXMLTransformer({ string: string, verbose: delegate.verbose });
        this.child.parent = this;
        if (delegate.verbose) {
          log('child', string);
        }
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
      if (this.cursor === 0) {
        this.cursor = this.matchResults.index;
      }

      var rest = this.string.substring(0, this.cursor);
      var replaced = this.scope().replace(pattern, replacement);

      var oldString = this.string;
      this.string = rest + replaced;
      if (delegate.verbose) {
        log('replace', oldString.length, this.string.length);
      }
    },

    replaceChildString: function(replacement) {
      var c = this.child;
      replacement = replacement || c.string;
      this.replaceFromCursor(c.originalString, replacement);
      this.matchingTag(
        this.matchingTag().replace(c.originalString, replacement)
      );

      c.originalString = c.string;
    },

    scope: function() {
      return this.string.substring(this.cursor);
    }
  };
};
