var fs = require('fs');
var path = require('path');
var url = require('url');
var util = require('./util');

var rLine = /\n/g;

module.exports = function createRepostGuard(delegate) {
  return {
    checkLink: function(link) {
      if (this.data === null) {
        throw 'no links data loaded';
      }
      link = this.normalizedLink(link);
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
        }.bind(this),
        onError: this.handleReadError.bind(this)
      });
    },

    tearDown: function() {
      var reset = function() {
          this.data = this.dataToCheck = null;
          this.dataChanged = false;
          this.lines = 0;
      }.bind(this);

      if (!this.dataChanged) {
        reset();
        return false;
      }
      util.writeFile({
        data: this.data,
        file: this.storeFile(),
        sync: delegate.sync,
        onDone: reset,
        onError: this.handleReadError.bind(this)
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
      if (this.lines === delegate.lineLimit) {
        data = data.substring(data.indexOf('\n'));
      }
      this.setData(data);
    },

    createStoreFile: function() {
      fs.openSync(this.storeFile(), 'a');
      this.setData('');
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

    handleReadError: function(error) {
      if (error.code === 'ENOENT') {
        this.createStoreFile();
      } else {
        throw error;
      }
    },

    handleWriteError: function(error) {
      throw error;
    },

    normalizedLink: function(link) {
      var parsed = url.parse(link);
      return parsed.host + parsed.pathname;
    },

    removeStoreFile: function() {
      fs.unlinkSync(this.storeFile());
    },

    setData: function(data) {
      this.data = data;
      this.dataToCheck = data.substring(0, this.currentPageIndex());
      var matchResults = data.match(rLine);
      this.lines = matchResults ? matchResults.length : 0;
    },

    storeFile: function() {
      return path.join(delegate.directory, 'links.txt');
    }
  };
};
