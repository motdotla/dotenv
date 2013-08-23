var assert      = require('assert'),
    should      = require('should'),
    dotenv      = require('../lib/main');

var result;

describe('dotenv', function() {
  before(function() {
    result = dotenv();
  });

  it('version should be set', function() {
    result.version.should.eql("0.0.3"); 
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
  });
});
