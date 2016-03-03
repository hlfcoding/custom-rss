var log = require('util').log;
var mode = process.env.NODE_ENV || 'development';
function noop() {}

function debugLog(label, string) {
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
