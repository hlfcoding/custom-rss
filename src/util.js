var fs = require('fs');
var log = require('util').log;
var url = require('url');

// section: debugging

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
  if (arguments.length > 1) {
    if (arguments.length > 2) {
      string = Array.prototype.slice.call(arguments, 1).map(toString).join('  ');
    } else {
      string = toString(arguments[1]);
    }
    string = label.toUpperCase() +': '+ string;
  } else {
    string = 'LOG: '+ arguments[0];
  }

  if (string.indexOf('\n') !== -1) {
    string = '\n\n'+ string;
  }

  log(string +'\n');
}
module.exports.log = (mode !== 'development') ? function() {} : debugLog;

// section: regex

module.exports.patterns = {
  brackets: { open: /&lt;/g, close: /&gt;/g },
  domain: /:\/\/(?:www\.)?([^\/]+)/,
  line: /\n/g,
  tag: /(<([^>]+)>)/g,

  createFromTokens: function(escapedTokens) {
    return new RegExp('\\b(' +
      escapedTokens.join('|').replace(/\s/g, '\\s') +
    ')\\b');
  },

  decodeTags: function(string) {
    return string.replace(this.brackets.open, '<')
      .replace(this.brackets.close, '>');
  },

  stripTags: function(string) {
    return this.decodeTags(string).replace(this.tag, '');
  }
};

// section: http

module.exports.normalizeLink = function(link) {
  var parsed = url.parse(link);
  parsed.host = parsed.host.replace(/^www\./, '');
  return parsed.host + parsed.pathname;
};

module.exports.request = function() {
  var module, protocol;
  if (typeof arguments[0] === 'string') {
    protocol = url.parse(arguments[0]).protocol;
  } else {
    protocol = arguments[0].protocol;
  }
  // http/s (`Error: Protocol "https:" not supported. Expected "http:".`)
  module = require(protocol.replace(':', ''));
  return module.request.apply(null, arguments);
};

// section: fs

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

// section: async

module.exports.callOn = function(calls, fn) {
  var remaining = calls - 1;
  return function() {
    if (remaining > 0) {
      remaining -= 1;
      return;
    }
    fn();
  };
};

// section: string

module.exports.nthIndexOf = function(string, search, n) {
  var i;
  for (i = 0; n > 0 && i !== -1; n -= 1) {
    i = string.indexOf(search, /* fromIndex */ i ? (i + 1) : i);
  }
  return i;
};

module.exports.nthLastIndexOf = function(string, search, n) {
  var i;
  for (i = string.length; n > 0 && i !== -1; n -= 1) {
    i = string.lastIndexOf(search, /* fromIndex */ i ? (i - 1) : i);
  }
  return i;
};
