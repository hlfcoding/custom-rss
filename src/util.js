var fs = require('fs');
var log = require('util').log;
var url = require('url');

var mode = process.env.NODE_ENV || 'development';
module.exports.mode = mode;

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
module.exports.log = (mode !== 'development') ? function() {} : debugLog;

module.exports.normalizeLink = function(link) {
  var parsed = url.parse(link);
  return parsed.host + parsed.pathname;
};

module.exports.patterns = {
  domain: /:\/\/(?:www\.)?([^\/]+)/,
  line: /\n/g,
  createFromTokens: function(escapedTokens) {
    return new RegExp('\\b('+ escapedTokens.join('|') +')\\b');
  }
};

function handleFileError(delegate, retry, error) {
  if (error.code === 'ENOENT') {
    fs.openSync(delegate.file, 'a');
    retry(delegate);
  } else {
    throw error;
  }
}

function appendFile(delegate) {
  delegate.onError = delegate.onError || handleFileError.bind(null, delegate, appendFile);
  var o = delegate.options || null;

  if (delegate.sync) {
    try { delegate.onDone(fs.appendFileSync(delegate.file, delegate.data, o)); }
    catch (error) { delegate.onError(error); }

  } else {
    fs.appendFile(delegate.file, delegate.data, o, function(error) {
      if (error) { return delegate.onError(error); }
      delegate.onDone();
    });
  }
}
function readFile(delegate) {
  delegate.onError = delegate.onError || handleFileError.bind(null, delegate, readFile);
  var o = delegate.options || 'utf8';

  if (delegate.sync) {
    try { delegate.onData(fs.readFileSync(delegate.file, o)); }
    catch (error) { delegate.onError(error); }

  } else {
    fs.readFile(delegate.file, o, function(error, data) {
      if (error) { return delegate.onError(error); }
      delegate.onData(data);
    });
  }
}
function writeFile(delegate) {
  delegate.onError = delegate.onError || handleFileError.bind(null, delegate, writeFile);
  var o = delegate.options || null;

  if (delegate.sync) {
    try { delegate.onDone(fs.writeFileSync(delegate.file, delegate.data, o)); }
    catch (error) { delegate.onError(error); }

  } else {
    fs.writeFile(delegate.file, delegate.data, o, function(error) {
      if (error) { return delegate.onError(error); }
      delegate.onDone();
    });
  }
}
module.exports.appendFile = appendFile;
module.exports.readFile = readFile;
module.exports.writeFile = writeFile;

module.exports.callOn = function(calls, fn) {
  var remaining = calls - 1;
  return function() {
    if (remaining > 0) { return remaining--; }
    fn();
  };
};
