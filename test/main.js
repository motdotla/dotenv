/*global describe:false, before:false, beforeEach:false, afterEach:false, it:false*/
"use strict";

require("assert");
require("should");
var sinon = require("sinon");

var fs = require("fs");
var dotenv = require("../lib/main");

describe("dotenv", function() {
  beforeEach(function() {
    this.s = sinon.sandbox.create();
  });

  afterEach(function() {
    this.s.restore();
  });

  describe("config", function() {
    var readFileSyncStub, parseStub;

    beforeEach(function() {
      readFileSyncStub = this.s.stub(fs, "readFileSync").returns("test=val");
      parseStub = this.s.stub(dotenv, "parse").returns({test: "val"});
    });

    it("takes option for path", function() {
      var testPath = "test/.env";
      dotenv.config({path: testPath});

      readFileSyncStub.args[0][0].should.eql(testPath);
    });

    it("takes option for encoding", function() {
      var testEncoding = "base64";
      dotenv.config({encoding: testEncoding});

      readFileSyncStub.args[0][1].should.have.property("encoding", testEncoding);
    });

    it("reads path with encoding, parsing output to process.env", function() {
      dotenv.config();

      readFileSyncStub.callCount.should.eql(1);
      parseStub.callCount.should.eql(1);
    });

    it("does not write over keys already in process.env", function() {
      process.env.TEST = "test";
      // "val" returned as value in `beforeEach`. should keep this "test"
      dotenv.config();

      process.env.TEST.should.eql("test");
    });

    it("catches any errors thrown from reading file or parsing", function() {
      var errorStub = this.s.stub(console, "error");
      readFileSyncStub.throws();

      dotenv.config().should.eql(false);
      errorStub.callCount.should.eql(1);
    });

  });

  describe("parse", function() {
    var parsed;
    before(function() {
      process.env.TEST = "test";
      parsed = dotenv.parse(fs.readFileSync("test/.env", {encoding: "utf8"}));
    });

    it("should return an object", function() {
      parsed.should.be.an.instanceOf(Object);
    });

    it("should parse a buffer from a file into an object", function(){
      var buffer = new Buffer("BASIC=basic");

      var payload = dotenv.parse( buffer );
      payload.should.have.property("BASIC", "basic");
    });

    it("sets basic environment variable", function() {
      parsed.BASIC.should.eql("basic");
    });

    it("reads after a skipped line", function() {
      parsed.AFTER_LINE.should.eql("after_line");
    });

    describe("expanding variables", function() {
      before(function() {
        process.env.BASIC = "should_not_be_chosen_because_exists_in_local_env";
      });

      it("expands environment variables like $BASIC", function() {
        parsed.BASIC_EXPAND.should.eql("basic");
      });

      it("prioritizes .env file value (if exists)", function() {
        parsed.BASIC_EXPAND.should.eql("basic");
      });

      it("defers to the machine set value", function() {
        // from `before`
        parsed.TEST_EXPAND.should.eql("test");
      });

      it("defaults missing variables to an empty string", function() {
        parsed.UNDEFINED_EXPAND.should.eql("");
      });

      it("does not expand escaped variables", function() {
        parsed.ESCAPED_EXPAND.should.equal("$ESCAPED");
      });
    });

    it("defaults empty values to empty string", function() {
      parsed.EMPTY.should.eql("");
    });

    it("escapes double quoted values", function() {
      parsed.DOUBLE_QUOTES.should.eql("double_quotes");
    });

    it("escapes single quoted values", function() {
      parsed.SINGLE_QUOTES.should.eql("single_quotes");
    });

    it("expands newlines but only if double quoted", function() {
      parsed.EXPAND_NEWLINES.should.eql("expand\nnewlines");
      parsed.DONT_EXPAND_NEWLINES_1.should.eql("dontexpand\\nnewlines");
      parsed.DONT_EXPAND_NEWLINES_2.should.eql("dontexpand\\nnewlines");
    });

    it("ignores commented lines", function() {
      parsed.should.not.have.property("COMMENTS");
    });

    it("respects equals signs in values", function() {
      parsed.EQUAL_SIGNS.should.eql("equals==");
    });

    it("handles zero width unicode characters", function() {
      parsed.ZERO_WIDTH_CHARACTER.should.eql("user:pass@troup.mongohq.com:1004/dude");
    });

    it ("retains inner quotes", function() {
      parsed.RETAIN_INNER_QUOTES.should.eql("{\"foo\": \"bar\"}");
      parsed.RETAIN_INNER_QUOTES_AS_STRING.should.eql("{\"foo\": \"bar\"}");
    });

  });
});
