var path = require('path');
var util = require('./util');

module.exports = function createRepostGuard(delegate) {
  return {
    checkLink: function(link) {
      if (this.data === null) { throw 'no links data loaded'; }

      link = util.normalizeLink(link);
      var isRepost = this.dataToCheck.indexOf(link) !== -1;
      if (!isRepost && this.data.indexOf(link) === -1) {
        this.appendLink(link);
      }
      return !isRepost;
    },

    setUp: function() {
      util.readFile({
        file: this.storeFile(),
        sync: delegate.sync,
        onData: function(data) {
          this.setData(data);
          if (!delegate.sync) {
            delegate.onReady();
          }
        }.bind(this)
      });
    },

    tearDown: function() {
      if (!this.dataChanged) {
        this.resetData();
        return false;
      }
      util.writeFile({
        data: this.data,
        file: this.storeFile(),
        sync: delegate.sync,
        onDone: this.resetData.bind(this)
      });
    },

    // Internal:

    data: null,
    dataToCheck: null,
    dataChanged: false,
    lines: 0,

    appendLink: function(link) {
      if (!this.dataChanged) {
        this.dataChanged = true;
      }
      var data = this.data + (link +'\n');
      var firstLineEnd = data.indexOf('\n');
      if (this.lines === delegate.lineLimit) {
        data = data.substring(firstLineEnd);
      }
      this.setData(data);
    },

    currentPageIndex: function() {
      var i = delegate.feedPageSize;
      var index;
      while (i--) {
        index = this.data.lastIndexOf('\n', index - 1);
        if (index === -1) {
          index = 0;
          break;
        }
      }
      return index;
    },

    resetData: function() {
      this.data = this.dataToCheck = null;
      this.dataChanged = false;
      this.lines = 0;
    },

    setData: function(data) {
      this.data = data;
      this.dataToCheck = data.substring(0, this.currentPageIndex());
      var matchResults = data.match(util.patterns.line);
      this.lines = matchResults ? matchResults.length : 0;
    },

    storeFile: function() {
      return path.join(delegate.directory, 'links.txt');
    }
  };
};
