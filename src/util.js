var fs = require('fs');
var log = require('util').log;
var mode = process.env.NODE_ENV || 'development';
function noop() {}

function debugLog(label) {
  function toString(value) {
    if (typeof value === 'function') {
      return '[function]';
    }
    return value.toString ? value.toString() : value;
  }

  var string;
  if (arguments.length > 2) {
    string = Array.prototype.slice.call(arguments, 1).map(toString).join('  ');
  } else {
    string = toString(arguments[1]);
  }
  string = label.toUpperCase() +': '+ string;
  if (string.indexOf('\n') !== -1) {
    string = '\n\n'+ string;
  }

  log(string +'\n');
}

var patterns = {
  domain: /:\/\/(?:www\.)?([^\/]+)/,
  createFromTokens: function(escapedTokens) {
    return new RegExp('\\b('+ escapedTokens.join('|') +')\\b');
  }
};

function readFile(delegate) {
  var o = delegate.options || 'utf8';
  if (delegate.sync) {
    try { delegate.onData(fs.readFileSync(delegate.file, o)); }
    catch (error) { delegate.onError(error); }

  } else {
    fs.readFile(delegate.file, o, function(error, data) {
      if (error) { return delegate.onError(error); }
      delegate.onData(data);
    }.bind(this));
  }
}

function writeFile(delegate) {
  var o = delegate.options || null;
  if (delegate.sync) {
    try { delegate.onDone(fs.writeFileSync(delegate.file, delegate.data, o)); }
    catch (error) { delegate.onError(error); }

  } else {
    fs.writeFile(delegate.file, delegate.data, o, function(error) {
      if (error) { return delegate.onError(error); }
      delegate.onDone();
    }.bind(this));
  }
}

module.exports = {
  log: (mode !== 'development') ? noop : debugLog,
  mode: mode,
  patterns: patterns,
  readFile: readFile,
  track: debugLog,
  writeFile: writeFile
};
