var log = require('util').log;
var mode = process.env.NODE_ENV || 'development';
function noop() {}

var debugLog = (mode !== 'development') ? noop :
  function(s) { log("\n"+ s +"\n"); };

module.exports = { mode: mode, log: debugLog };
