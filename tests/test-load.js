const fs = require('fs')
const os = require('os')
const path = require('path')

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

t.test('takes option for path', ct => {
  ct.plan(1)

  const testPath = 'tests/.env'
  dotenv.load({ path: testPath })

  ct.equal(readFileSyncStub.args[0][0], testPath)
})

t.test('takes option for path along with home directory char ~', ct => {
  ct.plan(2)
  const mockedHomedir = '/Users/dummy'
  const homedirStub = sinon.stub(os, 'homedir').returns(mockedHomedir)
  const testPath = '~/.env'
  dotenv.load({ path: testPath })

  ct.equal(readFileSyncStub.args[0][0], path.join(mockedHomedir, '.env'))
  ct.ok(homedirStub.called)
  homedirStub.restore()
})

t.test('takes option for encoding', ct => {
  ct.plan(1)

  const testEncoding = 'latin1'
  dotenv.load({ encoding: testEncoding })

  ct.equal(readFileSyncStub.args[0][1].encoding, testEncoding)
})

t.test('reads path with encoding, returns parsed version', ct => {
  ct.plan(2)

  const res = dotenv.load()

  ct.same(res, mockParseResponse)
  ct.equal(readFileSyncStub.callCount, 1)
})

t.test('does not modify process.env', ct => {
  ct.plan(2)

  const before = JSON.stringify(process.env)
  const env = dotenv.load()
  const after = JSON.stringify(process.env)

  ct.equal(env && env.test, mockParseResponse.test)
  ct.equal(before, after)
})

t.test('throws errors thrown from reading file or parsing', ct => {
  ct.plan(1)

  readFileSyncStub.throws()
  ct.throws(() => dotenv.load(), Error)
})
