var assert      = require('assert'),
    should      = require('should'),
    dotenv      = require('../lib/main');

var result, originalEnv=[];


function captureEnvironment() {
  var env = [];
  for (prop in process.env) {
    env[prop] = process.env[prop];
  }
  return env;
}

function resetEnvironment() {
  for (prop in process.env) {
    delete process.env[prop];
  }
  for (prop in originalEnv) {
    process.env[prop] = originalEnv[prop];
  }
}


describe('dotenv', function() {
  before(function() {
    // we must make the working directory /test so that dotenv._loadDefaults() works as expected
    process.chdir("./test");
    result = dotenv;
    originalEnv = captureEnvironment();
  });

  it('version should be set', function() {
    result.version.should.eql("0.2.2"); 
  });

  describe('.load()', function() {
    before(function() {
      result.load();
    });

    it('sets the basic environment variables', function() {
      process.env.BASIC.should.eql("basic");
    });

    it('sets double quotes environment variables', function() {
      process.env.DOUBLE_QUOTES.should.eql("double_quotes");
    });

    it('sets single quotes environment variables', function() {
      process.env.SINGLE_QUOTES.should.eql("single_quotes");
    });

    it('expands newlines but only if double quoted', function() {
      process.env.EXPAND_NEWLINES.should.eql("expand\nnewlines");
      process.env.DONT_EXPAND_NEWLINES_1.should.eql("dontexpand\\nnewlines");
      process.env.DONT_EXPAND_NEWLINES_2.should.eql("dontexpand\\nnewlines");
    });

    it('reads from .env.development', function() {
      process.env.FROM_DEVELOPMENT_ENV.should.eql("from_development_env");
    });

    it('overrides any values in .env with .env.environment', function() {
      process.env.ENVIRONMENT_OVERRIDE.should.eql("development");
    });

    it('reads from a skipped line in .env.development', function() {
      process.env.AFTER_LINE.should.eql("after_line");
    });
    
    it('ignores commented lines', function() {
      should.not.exist(process.env.COMMENTS);
    });

    it('respects equals signs in values', function() {
      process.env.EQUAL_SIGNS.should.eql("equals==");
    });

  });

  describe('.load() after an ENV was already set on the machine', function() {
    before(function() {
      process.env.ENVIRONMENT_OVERRIDE = "set_on_machine";
      result.load();
    });

    it('sets using the value set on the machine', function() {
      process.env.ENVIRONMENT_OVERRIDE.should.eql("set_on_machine");
    });
  });


  describe('.load(pathname)', function() {
    beforeEach(function() {
      resetEnvironment();
    });

    it('can read values from arbitrary files', function() {
      result.load("environment");
      process.env.LOADED_FROM_FILE.should.eql("environment");
    });

    it('returns false if trying to load from a missing file', function() {
      var loaded = result.load("file_does_not_exist");
      loaded.should.eql(false);
    });

  });



});
