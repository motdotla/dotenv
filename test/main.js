var assert      = require('assert'),
    should      = require('should'),
    fs          = require('fs'),
    dotenv      = require('../lib/main');

var result;

describe('dotenv', function() {
  before(function() {
    result = dotenv;
  });

  it('version should be set', function() {
    result.version.should.eql("0.2.7"); 
  });

  describe('.load()', function() {
    before(function() {
      result.load();
    });

    it('sets the basic environment variables', function() {
      process.env.BASIC.should.eql("basic");
    });

    it('sets empty enviroment variable', function () {
      process.env.EMPTY.should.eql("");
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

    it('should handle zero width unicode characters', function() {
      process.env.ZERO_WIDTH_CHARACTER.should.eql("user:pass@troup.mongohq.com:1004/dude");
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

  describe('.parse()', function(){
    it('should return an object', function(){
      dotenv.parse('').should.be.an.Object;
    });
    var buffer;
    before(function(done){
      fs.readFile('.env', function(err,res){
        buffer = res;
        done();
      })
    });

    it('should parse a buffer from a file into an object', function(){
      var payload = dotenv.parse( buffer );
      payload.should.be.an.Object;
      payload.should.have.property('BASIC', 'basic');
    })
  })
});
