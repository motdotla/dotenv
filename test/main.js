'use strict'

require('should')
var sinon = require('sinon')
var Lab = require('lab')
var lab = exports.lab = Lab.script()
var describe = lab.experiment
var before = lab.before
var beforeEach = lab.beforeEach
var afterEach = lab.afterEach
var it = lab.test
var fs = require('fs')
var dotenv = require('../lib/main')
var s

describe('dotenv', function () {
  beforeEach(function () {
    s = sinon.sandbox.create()
  })

  afterEach(function () {
    s.restore()
  })

  describe('config', function () {
    var readFileSyncStub, parseStub

    beforeEach(function () {
      readFileSyncStub = s.stub(fs, 'readFileSync').returns('test=val')
      parseStub = s.stub(dotenv, 'parse').returns({test: 'val'})
    })

    it('takes option for path', function () {
      var testPath = 'test/.env'
      dotenv.config({path: testPath})

      readFileSyncStub.args[0][0].should.eql(testPath)
    })

    it('takes option for encoding', function () {
      var testEncoding = 'base64'
      dotenv.config({encoding: testEncoding})

      readFileSyncStub.args[0][1].should.have.property('encoding', testEncoding)
    })

    it('reads path with encoding, parsing output to process.env', function () {
      dotenv.config()

      readFileSyncStub.callCount.should.eql(1)
      parseStub.callCount.should.eql(1)
    })

    it('makes load a synonym of config', function () {
      dotenv.load()

      readFileSyncStub.callCount.should.eql(1)
      parseStub.callCount.should.eql(1)
    })

    it('does not write over keys already in process.env', function () {
      process.env.test = 'test'
      // 'val' returned as value in `beforeEach`. should keep this 'test'
      dotenv.config()

      process.env.test.should.eql('test')
    })

    it('does not write over keys already in process.env if the key has a falsy value', function () {
      process.env.test = ''
      // 'val' returned as value in `beforeEach`. should keep this ''
      dotenv.config()

      Boolean(process.env.test).should.eql(false)
    })

    it('returns parsed object', function () {
      var env = dotenv.config()

      env.should.not.have.property('error')
      env.parsed.should.eql({ test: 'val' })
    })

    it('returns any errors thrown from reading file or parsing', function () {
      readFileSyncStub.throws()

      var env = dotenv.config()
      env.should.have.property('error')
      env.error.should.be.instanceOf(Error)
    })
  })

  describe('parse', function () {
    var parsed
    before(function () {
      process.env.TEST = 'test'
      parsed = dotenv.parse(fs.readFileSync('test/.env', {encoding: 'utf8'}))
    })

    it('should return an object', function () {
      parsed.should.be.an.instanceOf(Object)
    })

    it('should parse a buffer from a file into an object', function () {
      var buffer = new Buffer('BASIC=basic')

      var payload = dotenv.parse(buffer)
      payload.should.have.property('BASIC', 'basic')
    })

    it('sets basic environment variable', function () {
      parsed.BASIC.should.eql('basic')
    })

    it('reads after a skipped line', function () {
      parsed.AFTER_LINE.should.eql('after_line')
    })

    it('defaults empty values to empty string', function () {
      parsed.EMPTY.should.eql('')
    })

    it('escapes double quoted values', function () {
      parsed.DOUBLE_QUOTES.should.eql('double_quotes')
    })

    it('escapes single quoted values', function () {
      parsed.SINGLE_QUOTES.should.eql('single_quotes')
    })

    it('expands newlines but only if double quoted', function () {
      parsed.EXPAND_NEWLINES.should.eql('expand\nnewlines')
      parsed.DONT_EXPAND_NEWLINES_1.should.eql('dontexpand\\nnewlines')
      parsed.DONT_EXPAND_NEWLINES_2.should.eql('dontexpand\\nnewlines')
    })

    it('ignores commented lines', function () {
      parsed.should.not.have.property('COMMENTS')
    })

    it('respects equals signs in values', function () {
      parsed.EQUAL_SIGNS.should.eql('equals==')
    })

    it('retains inner quotes', function () {
      parsed.RETAIN_INNER_QUOTES.should.eql('{"foo": "bar"}')
      parsed.RETAIN_INNER_QUOTES_AS_STRING.should.eql('{"foo": "bar"}')
    })

    it('retains spaces in string', function () {
      parsed.INCLUDE_SPACE.should.eql('some spaced out string')
    })

    it('parses email addresses completely', function () {
      parsed.should.have.property('USERNAME', 'therealnerdybeast@example.tld')
    })
  })
})
