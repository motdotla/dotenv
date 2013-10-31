var assert = require('assert'),
    should = require('should'),
    dotenv;


describe('dotenv', function() {
  before(function() {
    dotenv = require('../lib/main');
  });

  it('sets a basic environment variable', function() {
    process.env.BASIC.should.eql("basic");
  });

  it('sets a numeric environment variable', function() {
    process.env.NUMERIC.should.eql(1);
  });

  it('sets single quotes environment variables', function() {
    process.env.SINGLE_QUOTES.should.eql("single_quotes");
  });

  it('sets double quotes environment variables', function() {
    process.env.DOUBLE_QUOTES.should.eql("double_quotes");
  });

  it('expands newlines but only if double quoted', function() {
    process.env.EXPAND_NEWLINES.should.eql("expand\nnewlines");
    process.env.DONT_EXPAND_NEWLINES_1.should.eql("dontexpand\\nnewlines");
    process.env.DONT_EXPAND_NEWLINES_2.should.eql("dontexpand\\nnewlines");
  });

  it('allows new lines between vars', function() {
    process.env.SPACE.should.eql("allowed");
  });

  describe('load other environment', function() {
    before(function() {
      dotenv.load('.env.development');
    });

    it('reads from .env.development', function() {
      process.env.FROM_DEVELOPMENT_ENV.should.eql("from_development_env");
    });

    it('reads from a skipped line in .env.development', function() {
      process.env.AFTER_LINE.should.eql("after_line");
    });
  });
});
