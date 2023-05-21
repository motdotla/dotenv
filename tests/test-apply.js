const fs = require('fs')

const sinon = require('sinon')
const t = require('tap')

const dotenv = require('../lib/main')

const mockParseResponse = { test: 'foo' }
let readFileSyncStub
let parseStub

t.beforeEach(() => {
  readFileSyncStub = sinon.stub(fs, 'readFileSync').returns('test=foo')
  parseStub = sinon.stub(dotenv, 'parse').returns(mockParseResponse)
})

t.afterEach(() => {
  readFileSyncStub.restore()
  parseStub.restore()
})

t.test('takes source and check if all keys applied to target', ct => {
  ct.plan(1)

  const source = { test: 1, home: 2 }
  const target = {}

  dotenv.apply(source, target)

  ct.same(source, target)
})

t.test('does not write over keys already in target', ct => {
  ct.plan(1)

  const existing = 'bar'
  const source = { test: 'test' }
  process.env.test = existing

  // 'test' returned as value in `beforeEach`. should keep this 'bar'
  dotenv.apply(source, process.env)

  ct.equal(process.env.test, existing)
})

t.test('does write over keys already in target if override turned on', ct => {
  ct.plan(1)

  const existing = 'bar'
  const source = { test: 'test' }
  process.env.test = existing

  // 'test' returned as value in `beforeEach`. should change this 'bar' to 'test'
  dotenv.apply(source, process.env, { override: true })

  ct.equal(process.env.test, source.test)
})

t.test('logs any errors applying when in debug mode but override turned off', ct => {
  ct.plan(2)

  const logStub = sinon.stub(console, 'log')

  const source = { test: false }
  process.env.test = true

  dotenv.apply(source, process.env, { debug: true })

  ct.not(process.env.test, source.test)
  ct.ok(logStub.called)

  logStub.restore()
})

t.test('logs applying when debug mode and override turned on', ct => {
  ct.plan(1)

  const logStub = sinon.stub(console, 'log')

  const source = { test: false }
  process.env.test = true

  dotenv.apply(source, process.env, { debug: true, override: true })

  console.log('process', process.env.test, source.test)

  ct.ok(logStub.called)

  logStub.restore()
})

t.test('returns any errors thrown on passing not json type', ct => {
  ct.plan(1)

  try {
    dotenv.apply('', process.env)
  } catch (e) {
    ct.equal(e.message, 'INVALID_SOURCE_OBJECT:: Please check the source object being passed to apply')
  }
})
