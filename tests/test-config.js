/* @flow */

const fs = require('fs')

const sinon = require('sinon')
const t = require('tap')

const dotenv = require('../lib/main')

const mockParseResponse = { test: 'foo' }
let readFileSyncStub
let parseStub

t.plan(11)

t.beforeEach(done => {
  readFileSyncStub = sinon.stub(fs, 'readFileSync')
  readFileSyncStub.withArgs('tests/.env').returns('test=foo')
  readFileSyncStub.withArgs('tests/.env.example').returns('test=foo\nbar=baz')
  readFileSyncStub.withArgs('tests/.env.default').returns('test=foo\nbar=baz')
  readFileSyncStub.returns('test=foo')
  parseStub = sinon.stub(dotenv, 'parse').returns(mockParseResponse)
  done()
})

t.afterEach(done => {
  readFileSyncStub.restore()
  parseStub.restore()
  done()
})

t.test('takes option for path', ct => {
  ct.plan(1)

  const testPath = 'tests/.env'
  dotenv.config({ path: testPath })

  ct.equal(readFileSyncStub.args[0][0], testPath)
})

t.test('takes option for encoding', ct => {
  ct.plan(1)

  const testEncoding = 'latin1'
  dotenv.config({ encoding: testEncoding })

  ct.equal(readFileSyncStub.args[0][1].encoding, testEncoding)
})

t.test('takes option for debug', ct => {
  ct.plan(1)

  const logStub = sinon.stub(console, 'log')
  dotenv.config({ debug: 'true' })

  ct.ok(logStub.called)
  logStub.restore()
})

t.test('takes option for extended', ct => {
  ct.plan(3)

  const testPath = 'test/.env'
  const examplePath = 'tests/.env.example'
  const defaultPath = 'tests/.env.default'
  dotenv.config({ extended: 'true', path: testPath, examplePath, defaultPath })

  const calls = readFileSyncStub.getCalls()
  ct.equal(calls[0].args[0], testPath)
  ct.equal(calls[1].args[0], examplePath)
  ct.equal(calls[2].args[0], defaultPath)
})

t.test('reads path with encoding, parsing output to process.env', ct => {
  ct.plan(2)

  const res = dotenv.config()

  ct.same(res.parsed, mockParseResponse)
  ct.equal(readFileSyncStub.callCount, 1)
})

t.test('with extended, throws if a variable is not provided', ct => {
  ct.plan(1)

  const examplePath = 'tests/.env.example'

  const res = dotenv.config({ extended: 'true', examplePath })

  ct.same(res.error, new Error('Missing variables!'))
})

t.test('with extended, uses default if variable is not provided', ct => {
  ct.plan(1)

  const examplePath = 'tests/.env.example'
  const defaultPath = 'tests/.env.default'

  const res = dotenv.config({ extended: 'true', examplePath, defaultPath })

  ct.same(res.parsed, { test: 'foo', bar: 'baz' })
})

t.test('does not write over keys already in process.env', ct => {
  ct.plan(2)

  const existing = 'bar'
  process.env.test = existing
  // 'foo' returned as value in `beforeEach`. should keep this 'bar'
  const env = dotenv.config()

  ct.equal(env.parsed && env.parsed.test, mockParseResponse.test)
  ct.equal(process.env.test, existing)
})

t.test(
  'does not write over keys already in process.env if the key has a falsy value',
  ct => {
    ct.plan(2)

    const existing = ''
    process.env.test = existing
    // 'foo' returned as value in `beforeEach`. should keep this ''
    const env = dotenv.config()

    ct.equal(env.parsed && env.parsed.test, mockParseResponse.test)
    // NB: process.env.test becomes undefined on Windows
    ct.notOk(process.env.test)
  }
)

t.test('returns parsed object', ct => {
  ct.plan(2)

  const env = dotenv.config()

  ct.notOk(env.error)
  ct.same(env.parsed, mockParseResponse)
})

t.test('returns any errors thrown from reading file or parsing', ct => {
  ct.plan(1)

  readFileSyncStub.throws()
  const env = dotenv.config()

  ct.type(env.error, Error)
})
