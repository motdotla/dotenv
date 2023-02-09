const fs = require('fs')

const sinon = require('sinon')
const t = require('tap')

const dotenv = require('../lib/main')
const MissingEnvVarsError = require('../lib/missing-vars-error')

const mockParseResponse = { test: 'foo' }
let readFileSyncStub
let parseStub

t.beforeEach(() => {
  readFileSyncStub = sinon.stub(fs, 'readFileSync').onFirstCall().returns('test=foo')
  readFileSyncStub.onSecondCall().returns('test=foo')
  readFileSyncStub.onThirdCall().returns('nonExistentKey=foo')
  parseStub = sinon.stub(dotenv, 'parse').returns(mockParseResponse)
})

t.afterEach(() => {
  readFileSyncStub.restore()
  parseStub.restore()
})

t.test('takes option for example', ct => {
  ct.plan(1)

  const examplePath = 'tests/.env.example'
  dotenv.safe({ example: examplePath })
  ct.equal(readFileSyncStub.args[1][0], examplePath)
})

t.test('returns any errors thrown from missing env', ct => {
  ct.plan(1)

  const examplePath = 'tests/.env.example'
  dotenv.safe({ example: examplePath })

  ct.throws(function () { throw new MissingEnvVarsError() }, {})
})
