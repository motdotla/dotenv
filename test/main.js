var assert      = require('assert'),
    should      = require('should'),
    dotenv      = require('../lib/main');

var result;

describe('dotenv', function() {
  before(function() {
    result = dotenv();
  });

  it('version should be set', function() {
    result.version.should.eql("0.0.2"); 
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
  });
});
