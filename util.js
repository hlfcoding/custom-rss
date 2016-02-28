const log = require('util').log;
const mode = process.env.NODE_ENV || 'development';
const noop = () => {};

let debugLog = (mode !== 'development') ? noop :
  (s) => { log(`\n${s}\n`); };

module.exports = { mode, log: debugLog };
