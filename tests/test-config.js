/* @flow */

const fs = require('fs')
const path = require('path')

const sinon = require('sinon')
const t = require('tap')

const dotenv = require('../lib/main')

const mockParseResponse = { test: 'foo' }
const envPath = path.resolve(process.cwd(), '.env')
const testPath = 'tests/.env'
let readFileSyncStub
let parseStub

t.plan(11)

t.beforeEach(done => {
  readFileSyncStub = sinon.stub(fs, 'readFileSync').returns('test=foo')
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

t.test('takes option for multiConfig (NODE_ENV defined)', ct => {
  ct.plan(1)

  const env = process.env.NODE_ENV
  process.env.NODE_ENV = 'development'

  dotenv.config({ multiConfig: true })

  ct.equal(
    readFileSyncStub.args[0][0],
    `${envPath}.${process.env.NODE_ENV}`
  )

  process.env.NODE_ENV = env
})

t.test('takes option for multiConfig (NODE_ENV undefined)', ct => {
  ct.plan(1)

  const env = process.env.NODE_ENV
  process.env.NODE_ENV = undefined

  dotenv.config({ multiConfig: true })

  ct.equal(readFileSyncStub.args[0][0], envPath)

  process.env.NODE_ENV = env
})

t.test('takes option for multiConfig (custom path)', ct => {
  ct.plan(1)

  const env = process.env.NODE_ENV
  process.env.NODE_ENV = 'development'

  dotenv.config({ multiConfig: true, path: testPath })

  ct.equal(
    readFileSyncStub.args[0][0],
    `${testPath}.${process.env.NODE_ENV}`
  )

  process.env.NODE_ENV = env
})

t.test('reads path with encoding, parsing output to process.env', ct => {
  ct.plan(2)

  const res = dotenv.config()

  ct.same(res.parsed, mockParseResponse)
  ct.equal(readFileSyncStub.callCount, 1)
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
