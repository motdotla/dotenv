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

t.test('takes processEnv and check if all keys applied to processEnv', ct => {
  ct.plan(1)

  const parsed = { test: 1, home: 2 }
  const processEnv = {}

  dotenv.populate(processEnv, parsed)

  ct.same(parsed, processEnv)
})

t.test('does not write over keys already in processEnv', ct => {
  ct.plan(1)

  const existing = 'bar'
  const parsed = { test: 'test' }
  process.env.test = existing

  // 'test' returned as value in `beforeEach`. should keep this 'bar'
  dotenv.populate(process.env, parsed)

  ct.equal(process.env.test, existing)
})

t.test('does write over keys already in processEnv if override turned on', ct => {
  ct.plan(1)

  const existing = 'bar'
  const parsed = { test: 'test' }
  process.env.test = existing

  // 'test' returned as value in `beforeEach`. should change this 'bar' to 'test'
  dotenv.populate(process.env, parsed, { override: true })

  ct.equal(process.env.test, parsed.test)
})

t.test('logs any errors populating when in debug mode but override turned off', ct => {
  ct.plan(2)

  const logStub = sinon.stub(console, 'log')

  const parsed = { test: false }
  process.env.test = true

  dotenv.populate(process.env, parsed, { debug: true })

  ct.not(process.env.test, parsed.test)
  ct.ok(logStub.called)

  logStub.restore()
})

t.test('logs populating when debug mode and override turned on', ct => {
  ct.plan(1)

  const logStub = sinon.stub(console, 'log')

  const parsed = { test: false }
  process.env.test = true

  dotenv.populate(process.env, parsed, { debug: true, override: true })

  console.log('process', process.env.test, parsed.test)

  ct.ok(logStub.called)

  logStub.restore()
})

t.test('returns any errors thrown on passing not json type', ct => {
  ct.plan(1)

  try {
    dotenv.populate(process.env, '')
  } catch (e) {
    ct.equal(e.message, 'OBJECT_REQUIRED: Please check the processEnv argument being passed to populate')
  }
})
