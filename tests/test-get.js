const fs = require('fs')

const sinon = require('sinon')
const t = require('tap')

const dotenv = require('../lib/main')

const mockParseResponse = { test: 'foo', someBool: 'true' }
let readFileSyncStub
let parseStub

t.beforeEach(() => {
  readFileSyncStub = sinon.stub(fs, 'readFileSync').returns('test=foo\nsomeBool=true')
  parseStub = sinon.stub(dotenv, 'parse').returns(mockParseResponse)
})

t.afterEach(() => {
  readFileSyncStub.restore()
  parseStub.restore()
})

t.test('get env variable', ct => {
  ct.plan(1)

  dotenv.config()

  ct.ok(dotenv.get('test') === 'foo')
})

t.test('get env variable from processEnv', ct => {
  ct.plan(1)

  const myEnv = { another: 'foo' }

  dotenv.config({ processEnv: myEnv })

  ct.ok(dotenv.get('another') === 'foo')
})

t.test('get env variable and parse boolean', ct => {
  ct.plan(2)

  dotenv.config()

  ct.ok(typeof dotenv.get('someBool') === 'boolean')
  ct.ok(dotenv.get('someBool') === true)
})

t.test('throws if env variable is not found', ct => {
  ct.plan(1)

  dotenv.config()

  ct.throws(() => {
    dotenv.get('notfound')
  })
})
