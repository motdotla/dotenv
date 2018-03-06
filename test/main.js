'use strict'

require('should')
let sinon = require('sinon')
var Lab = require('lab')
var lab = exports.lab = Lab.script()
var describe = lab.experiment
var before = lab.before
var beforeEach = lab.beforeEach
var afterEach = lab.afterEach
var it = lab.test
let fs = require('fs')
let dotenv = require('../lib/main')
let s

describe('dotenv', () => {
  beforeEach(done => {
    s = sinon.sandbox.create()
    done()
  })

  afterEach(done => {
    s.restore()
    done()
  })

  const mockParseResponse = {test: 'val'}

  describe('config', () => {
    let readFileSyncStub

    beforeEach(done => {
      readFileSyncStub = s.stub(fs, 'readFileSync').returns('test=val')
      s.stub(dotenv, 'parse').returns(mockParseResponse)
      done()
    })

    it('takes option for path', done => {
      let testPath = 'test/.env'
      dotenv.config({path: testPath})

      readFileSyncStub.args[0][0].should.eql(testPath)
      done()
    })

    it('takes option for encoding', done => {
      let testEncoding = 'base64'
      dotenv.config({encoding: testEncoding})

      readFileSyncStub.args[0][1].should.have.property('encoding', testEncoding)
      done()
    })

    it('reads path with encoding, parsing output to process.env', done => {
      const res = dotenv.config()
      res.parsed.should.deepEqual(mockParseResponse)

      readFileSyncStub.callCount.should.eql(1)
      done()
    })

    it('makes load a synonym of config', done => {
      const env = dotenv.load()
      env.should.have.property('parsed')
      env.parsed.should.deepEqual(mockParseResponse)

      readFileSyncStub.callCount.should.eql(1)
      done()
    })

    it('does not write over keys already in process.env', done => {
      process.env.test = 'test'
      // 'val' returned as value in `beforeEach`. should keep this 'test'
      const env = dotenv.config()

      env.should.have.property('parsed')
      env.parsed.should.have.property('test')
      env.parsed.test.should.eql(mockParseResponse.test)

      process.env.should.have.property('test')
      process.env.test.should.eql('test')
      done()
    })

    it('does not write over keys already in process.env if the key has a falsy value', done => {
      process.env.test = ''
      // 'val' returned as value in `beforeEach`. should keep this ''
      const env = dotenv.config()

      env.should.have.property('parsed')
      env.parsed.should.have.property('test')
      env.parsed.test.should.eql(mockParseResponse.test)

      process.env.should.have.property('test')
      // NB: process.env.test becomes undefined on Windows
      Boolean(process.env.test).should.eql(false)
      done()
    })

    it('returns parsed object', done => {
      let env = dotenv.config()

      env.should.not.have.property('error')
      env.parsed.should.eql(mockParseResponse)
      done()
    })

    it('returns any errors thrown from reading file or parsing', done => {
      readFileSyncStub.throws()

      let env = dotenv.config()
      env.should.have.property('error')
      env.error.should.be.instanceOf(Error)
      done()
    })
  })

  describe('parse', () => {
    let parsed
    before(done => {
      process.env.TEST = 'test'
      parsed = dotenv.parse(fs.readFileSync('test/.env', {encoding: 'utf8'}))
      done()
    })

    it('should return an object', done => {
      parsed.should.be.an.instanceOf(Object)
      done()
    })

    it('should parse a buffer from a file into an object', done => {
      let buffer = new Buffer('BASIC=basic')

      let payload = dotenv.parse(buffer)
      payload.should.have.property('BASIC', 'basic')
      done()
    })

    it('sets basic environment letiable', done => {
      parsed.BASIC.should.eql('basic')
      done()
    })

    it('reads after a skipped line', done => {
      parsed.AFTER_LINE.should.eql('after_line')
      done()
    })

    it('defaults empty values to empty string', done => {
      parsed.EMPTY.should.eql('')
      done()
    })

    it('escapes double quoted values', done => {
      parsed.DOUBLE_QUOTES.should.eql('double_quotes')
      done()
    })

    it('escapes single quoted values', done => {
      parsed.SINGLE_QUOTES.should.eql('single_quotes')
      done()
    })

    it('expands newlines but only if double quoted', done => {
      parsed.EXPAND_NEWLINES.should.eql('expand\nnewlines')
      parsed.DONT_EXPAND_NEWLINES_1.should.eql('dontexpand\\nnewlines')
      parsed.DONT_EXPAND_NEWLINES_2.should.eql('dontexpand\\nnewlines')
      done()
    })

    it('ignores commented lines', done => {
      parsed.should.not.have.property('COMMENTS')
      done()
    })

    it('respects equals signs in values', done => {
      parsed.EQUAL_SIGNS.should.eql('equals==')
      done()
    })

    it('retains inner quotes', done => {
      parsed.RETAIN_INNER_QUOTES.should.eql('{"foo": "bar"}')
      parsed.RETAIN_INNER_QUOTES_AS_STRING.should.eql('{"foo": "bar"}')
      done()
    })

    it('retains spaces in string', done => {
      parsed.INCLUDE_SPACE.should.eql('some spaced out string')
      done()
    })

    it('parses email addresses completely', done => {
      parsed.should.have.property('USERNAME', 'therealnerdybeast@example.tld')
      done()
    })
  })
})
