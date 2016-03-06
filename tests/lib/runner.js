var afterEach, beforeEach, failed, total;
failed = total = 0;

var colors = {
  none: '\x1b[0m',
  fail: '\x1b[31m',
  pass: '\x1b[32m'
};

module.exports = {
  exitEarly: false,

  afterEach: function(block) {
    afterEach = block;
  },

  beforeEach: function(block) {
    beforeEach = block;
  },

  test: function(description, block) {
    try {
      if (beforeEach) { beforeEach(); }
      block();
      console.log(colors.pass, 'PASS', description);

    } catch (error) {
      console.error(colors.fail, 'FAIL', description);
      if ('actual' in error && 'expected' in error) {
        console.log('      ACTUALLY', error.actual,
          'EXPECTED', error.expected, colors.none);
      } else {
        console.log('\n', error.stack, '\n');
      }
      if (this.exitEarly && failed > 0) {
        console.log(colors.fail, 'STOPPING early from failures!\n');
        process.exit(1);
      } else {
        failed += 1;
      }

    } finally {
      total += 1;
      if (afterEach) { afterEach(); }
    }
  },

  report: function() {
    console.log('\n');
    console.log(
      colors.pass, 'PASSED', total - failed,
      colors.fail, 'FAILED', failed,
      colors.none, 'TOTAL', total, '\n'
    );
    afterEach = beforeEach = null;
  },

  subject: function(description) {
    console.log(colors.none, '\n', description, '\n');
  }
};
