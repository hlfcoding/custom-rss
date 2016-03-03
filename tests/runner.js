var afterEach, beforeEach, failed, total;
failed = total = 0;

module.exports = {
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
      console.log('PASS', description);

    } catch (error) {
      console.error('FAIL', description);
      if ('actual' in error && 'expected' in error) {
        console.log('     ACTUALLY', error.actual, 'EXPECTED', error.expected);
      } else {
        console.log('\n', error.stack, '\n');
      }
      failed += 1;

    } finally {
      total += 1;
      if (afterEach) { afterEach(); }
    }
  },

  report: function() {
    var passed = total - failed;
    console.log('\nPASSED', passed, 'FAILED', failed);
    if (failed > 0) {
      console.log('STOPPING early from failures!\n');
      process.exit(1);
    } else {
      console.log('');
    }
  },

  subject: function(description) {
    console.log(description, '\n');
  }
};
