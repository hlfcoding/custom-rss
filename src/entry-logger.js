var path = require('path');
var util = require('./util');

module.exports = function createEntryLogger(delegate) {
  return {
    logEntry: function(entry) {
      if (this.data === null) { throw 'no entry data loaded'; }
      if (this.data.indexOf(entry.id) !== -1) { return false; }

      var line = entry.id +' : '+ entry.title +'\n';
      if (!this.dataChanged) {
        this.dataChanged = true;
      }
      var data = this.data + line;
      var lines = this.lines + 1;

      var archiveUntil;
      if (lines > delegate.lineLimit) {
        // End index of lines past the limit, include '\n'.
        archiveUntil = util.nthIndexOf(data, '\n', lines - delegate.lineLimit) + 1;
        this.archiveBuffer += data.substring(0, archiveUntil);
        data = data.substring(archiveUntil);
      }

      this.setData(data);
    },

    setUp: function() {
      util.readFile({
        file: this.contextFile(),
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
        file: this.contextFile(),
        sync: delegate.sync,
        onDone: this.resetData.bind(this)
      });
      util.appendFile({
        data: this.archiveBuffer,
        file: this.archiveFile(),
        sync: delegate.sync,
        onDone: function() {
          this.archiveBuffer = '';
        }.bind(this)
      });
    },

    // Internal:

    archiveBuffer: '',
    data: null,
    dataChanged: false,
    lines: 0,

    archiveFile: function() {
      return path.join(delegate.directory,
        delegate.feedName +'-entries.txt');
    },

    contextFile: function() {
      return path.join(delegate.directory,
        delegate.feedName +'-entries-context.txt');
    },

    resetData: function() {
      this.data = null;
      this.dataChanged = false;
      this.lines = 0;
    },

    setData: function(data) {
      this.data = data;
      var matchResults = data.match(util.patterns.line);
      this.lines = matchResults ? matchResults.length : 0;
    }
  };
};
