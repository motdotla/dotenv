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

t.test('takes option for example', ct => {
  ct.plan(1)

  const testPath = 'tests/.env.example'
  dotenv.safe({ example: testPath })

  ct.equal(readFileSyncStub.args[0][0], testPath)
})

t.test('takes option for allowEmptyValues', ct => {
  ct.plan(1)

  const logStub = sinon.stub(console, 'log')
  dotenv.config({ allowEmptyValues: true })

  ct.ok(logStub.called)
  logStub.restore()
})
