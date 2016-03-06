var fs = require('fs');
var path = require('path');
var util = require('./util');

module.exports = function createRepostGuard(delegate) {
  return {
    check: function(link) {
      if (!this.data) {
        throw 'no links data loaded';
      }
    },

    setUp: function() {
      util.readFile({
        file: this.storeFile(),
        sync: delegate.sync,
        onData: function(data) {
          this.data = data;
        }.bind(this),
        onError: this.handleReadError.bind(this)
      });
    },

    tearDown: function() {
      util.writeFile({
        data: this.data,
        file: this.storeFile(),
        sync: delegate.sync,
        onDone: function(data) {
          this.data = null;
        }.bind(this),
        onError: this.handleReadError.bind(this)
      });
    },

    // Internal:

    data: null,

    createStoreFile: function() {
      fs.openSync(this.storeFile(), 'a');
      this.data = '';
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

    removeStoreFile: function() {
      fs.unlinkSync(this.storeFile());
    },

    storeFile: function() {
      return path.join(delegate.directory, 'links.txt');
    }
  };
};
