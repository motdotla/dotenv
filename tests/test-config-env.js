const fs = require('fs')
const path = require('path')

const t = require('tap')
const sinon = require('sinon')

const dotenv = require('../lib/main')

const mockParseResponse = { test: 'foo' }

let readFileSyncStub
let existingDotEnvPath
let existingDotEnvEncoding

t.beforeEach(done => {
  existingDotEnvEncoding = process.env.DOTENV_CONFIG_ENCODING
  existingDotEnvPath = process.env.DOTENV_CONFIG_PATH

  readFileSyncStub = sinon.stub(fs, 'readFileSync').returns('test=foo')
  sinon.stub(dotenv, 'parse').returns(mockParseResponse)
  done()
})

t.afterEach(done => {
  readFileSyncStub.restore()
  dotenv.parse.restore()

  process.env.DOTENV_CONFIG_PATH = existingDotEnvPath
  process.env.DOTENV_CONFIG_ENCODING = existingDotEnvEncoding
  done()
})

t.test('takes relative path to dotenv file from env', ct => {
  ct.plan(1)

  const testPath = 'tests/.env2'
  const expectedPath = path.resolve(process.cwd(), testPath)

  process.env.DOTENV_CONFIG_PATH = testPath
  dotenv.config()

  ct.equal(readFileSyncStub.args[0][0], expectedPath)
})

t.test('takes absolute unix path to dotenv file from env', ct => {
  ct.plan(1)

  const testPath = '/tmp/.env2'
  const expectedPath = path.resolve(process.cwd(), testPath)

  process.env.DOTENV_CONFIG_PATH = testPath
  dotenv.config()

  ct.equal(readFileSyncStub.args[0][0], expectedPath)
})

t.test('takes absolute windows path to dotenv file from env', ct => {
  ct.plan(1)

  const testPath = 'C:\\temp\\.env2'
  const expectedPath = path.resolve(process.cwd(), testPath)

  process.env.DOTENV_CONFIG_PATH = testPath
  dotenv.config()

  ct.equal(readFileSyncStub.args[0][0], expectedPath)
})

t.test('takes encoding for dotenv file from env', ct => {
  ct.plan(1)

  const testEncoding = 'base64'
  process.env.DOTENV_CONFIG_ENCODING = testEncoding
  dotenv.config()

  ct.equal(readFileSyncStub.args[0][1].encoding, testEncoding)
})
