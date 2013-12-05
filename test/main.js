var assert      = require('assert'),
    should      = require('should'),
    dotenv      = require('../lib/main');


function load(directory, path) {
    var originalDir = process.cwd();
    process.chdir(directory);
    var returnValue = dotenv.load(path);
    process.chdir(originalDir);
    return returnValue;
}


describe('dotenv', function() {

  it('version should be set', function() {
    dotenv.version.should.eql("0.2.2"); 
  });

  describe('.load()', function() {
    before(function() {
      load(__dirname + "/fixtures/basic");
    });

    after(dotenv.reset);

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
    
    it('ignores commented lines', function() {
      should.not.exist(process.env.COMMENTS);
    });

    it('respects equals signs in values', function() {
      process.env.EQUAL_SIGNS.should.eql("equals==");
    });

    it('trims leading and trailing whitespace', function() {
      process.env.WHITESPACE.should.eql("stripped");
    });

  });

  describe('.load() environment-specific overrides', function() {
    before(function() {
      load(__dirname + "/fixtures/override");
    });

    after(dotenv.reset);

    it('reads from .env.development', function() {
      process.env.FROM_DEVELOPMENT_ENV.should.eql("from_development_env");
    });

    it('overrides any values in .env with .env.environment', function() {
      process.env.ENVIRONMENT_OVERRIDE.should.eql("development");
    });

    it('reads from a skipped line in .env.development', function() {
      process.env.AFTER_LINE.should.eql("after_line");
    });
  });

  describe('.load() after an ENV was already set on the machine', function() {
    before(function() {
      process.env.ENVIRONMENT_OVERRIDE = "set_on_machine";
      load(__dirname + "/fixtures/basic");
    });

    after(function() {
      delete process.env.ENVIRONMENT_OVERRIDE;
    });

    it('sets using the value set on the machine', function() {
      process.env.ENVIRONMENT_OVERRIDE.should.eql("set_on_machine");
    });
  });


  describe('.load(filename)', function() {
    beforeEach(dotenv.reset);

    after(dotenv.reset);

    it('can read values from arbitrary files', function() {
      load(__dirname + "/fixtures/filename", "environment");
      process.env.LOADED_FROM_FILE.should.eql("environment");
    });

    it('returns false if trying to load from a missing file', function() {
      var loaded = load(__dirname + "/fixtures/filename", "file_does_not_exist");
      loaded.should.eql(false);
    });

    it('will override previously set values', function() {
      load(__dirname + "/fixtures/filename");
      load(__dirname + "/fixtures/filename", "environment");
      process.env.ENVIRONMENT_OVERRIDE.should.eql("file");
    });


  });

});
