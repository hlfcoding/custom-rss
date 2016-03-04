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
    string = Array.prototype.slice.call(arguments, 1).map(toString).join(', ');
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

module.exports = {
  log: (mode !== 'development') ? noop : debugLog,
  mode: mode,
  patterns: patterns,
  track: log
};
