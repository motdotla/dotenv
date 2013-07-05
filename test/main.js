var assert      = require('assert'),
    should      = require('should'),
    dotenv      = require('../lib/main');

describe('dotenv', function() {
  describe('.load()', function() {
    it('sets the environment variables', function() {
      var result = dotenv();

      result.load();
      
      process.env.BASIC.should.eql("basic");
    });
  });
});
