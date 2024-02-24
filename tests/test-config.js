const fs = require('fs')
const os = require('os')
const path = require('path')

const sinon = require('sinon')
const t = require('tap')

const dotenv = require('../lib/main')

t.beforeEach(() => {
  delete process.env.BASIC // reset
})

t.test('takes string for path option', ct => {
  const testPath = 'tests/.env'
  const env = dotenv.config({ path: testPath })

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(process.env.BASIC, 'basic')

  ct.end()
})

t.test('takes array for path option', ct => {
  const testPath = ['tests/.env']
  const env = dotenv.config({ path: testPath })

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(process.env.BASIC, 'basic')

  ct.end()
})

t.test('takes two or more files in the array for path option', ct => {
  const testPath = ['tests/.env.local', 'tests/.env']
  const env = dotenv.config({ path: testPath })

  ct.equal(env.parsed.BASIC, 'local_basic')
  ct.equal(process.env.BASIC, 'local_basic')

  ct.end()
})

t.test('sets values from both .env.local and .env. first file key wins.', ct => {
  delete process.env.SINGLE_QUOTES

  const testPath = ['tests/.env.local', 'tests/.env']
  const env = dotenv.config({ path: testPath })

  // in both files - first file wins (.env.local)
  ct.equal(env.parsed.BASIC, 'local_basic')
  ct.equal(process.env.BASIC, 'local_basic')

  // in .env.local only
  ct.equal(env.parsed.LOCAL, 'local')
  ct.equal(process.env.LOCAL, 'local')

  // in .env only
  ct.equal(env.parsed.SINGLE_QUOTES, 'single_quotes')
  ct.equal(process.env.SINGLE_QUOTES, 'single_quotes')

  ct.end()
})

t.test('sets values from both .env.local and .env. but none is used as value existed in process.env.', ct => {
  const testPath = ['tests/.env.local', 'tests/.env']
  process.env.BASIC = 'existing'

  const env = dotenv.config({ path: testPath })

  // does not override process.env
  ct.equal(env.parsed.BASIC, 'local_basic')
  ct.equal(process.env.BASIC, 'existing')

  ct.end()
})

t.test('takes URL for path option', ct => {
  const envPath = path.resolve(__dirname, '.env')
  const fileUrl = new URL(`file://${envPath}`)

  const env = dotenv.config({ path: fileUrl })

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(process.env.BASIC, 'basic')

  ct.end()
})

t.test('takes option for path along with home directory char ~', ct => {
  const readFileSyncStub = sinon.stub(fs, 'readFileSync').returns('test=foo')
  const mockedHomedir = '/Users/dummy'
  const homedirStub = sinon.stub(os, 'homedir').returns(mockedHomedir)
  const testPath = '~/.env'
  dotenv.config({ path: testPath })

  ct.equal(readFileSyncStub.args[0][0], path.join(mockedHomedir, '.env'))
  ct.ok(homedirStub.called)

  homedirStub.restore()
  readFileSyncStub.restore()
  ct.end()
})

t.test('takes option for encoding', ct => {
  const readFileSyncStub = sinon.stub(fs, 'readFileSync').returns('test=foo')

  const testEncoding = 'latin1'
  dotenv.config({ encoding: testEncoding })
  ct.equal(readFileSyncStub.args[0][1].encoding, testEncoding)

  readFileSyncStub.restore()
  ct.end()
})

t.test('takes option for debug', ct => {
  const logStub = sinon.stub(console, 'log')

  dotenv.config({ debug: 'true' })
  ct.ok(logStub.called)

  logStub.restore()
  ct.end()
})

t.test('reads path with encoding, parsing output to process.env', ct => {
  const readFileSyncStub = sinon.stub(fs, 'readFileSync').returns('BASIC=basic')
  const parseStub = sinon.stub(dotenv, 'parse').returns({ BASIC: 'basic' })

  const res = dotenv.config()

  ct.same(res.parsed, { BASIC: 'basic' })
  ct.equal(readFileSyncStub.callCount, 1)

  readFileSyncStub.restore()
  parseStub.restore()

  ct.end()
})

t.test('does not write over keys already in process.env', ct => {
  const testPath = 'tests/.env'
  const existing = 'bar'
  process.env.BASIC = existing
  const env = dotenv.config({ path: testPath })

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(process.env.BASIC, existing)

  ct.end()
})

t.test('does write over keys already in process.env if override turned on', ct => {
  const testPath = 'tests/.env'
  const existing = 'bar'
  process.env.BASIC = existing
  const env = dotenv.config({ path: testPath, override: true })

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(process.env.BASIC, 'basic')

  ct.end()
})

t.test('does not write over keys already in process.env if the key has a falsy value', ct => {
  const testPath = 'tests/.env'
  const existing = ''
  process.env.BASIC = existing
  const env = dotenv.config({ path: testPath })

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(process.env.BASIC, '')

  ct.end()
})

t.test('does write over keys already in process.env if the key has a falsy value but override is set to true', ct => {
  const testPath = 'tests/.env'
  const existing = ''
  process.env.BASIC = existing
  const env = dotenv.config({ path: testPath, override: true })

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(process.env.BASIC, 'basic')
  ct.end()
})

t.test('can write to a different object rather than process.env', ct => {
  const testPath = 'tests/.env'
  process.env.BASIC = 'other' // reset process.env

  const myObject = {}
  const env = dotenv.config({ path: testPath, processEnv: myObject })

  ct.equal(env.parsed.BASIC, 'basic')
  console.log('logging', process.env.BASIC)
  ct.equal(process.env.BASIC, 'other')
  ct.equal(myObject.BASIC, 'basic')

  ct.end()
})

t.test('returns parsed object', ct => {
  const testPath = 'tests/.env'
  const env = dotenv.config({ path: testPath })

  ct.notOk(env.error)
  ct.equal(env.parsed.BASIC, 'basic')

  ct.end()
})

t.test('returns any errors thrown from reading file or parsing', ct => {
  const readFileSyncStub = sinon.stub(fs, 'readFileSync').returns('test=foo')

  readFileSyncStub.throws()
  const env = dotenv.config()

  ct.type(env.error, Error)

  readFileSyncStub.restore()

  ct.end()
})

t.test('logs any errors thrown from reading file or parsing when in debug mode', ct => {
  ct.plan(2)

  const logStub = sinon.stub(console, 'log')
  const readFileSyncStub = sinon.stub(fs, 'readFileSync').returns('test=foo')

  readFileSyncStub.throws()
  const env = dotenv.config({ debug: true })

  ct.ok(logStub.called)
  ct.type(env.error, Error)

  logStub.restore()
  readFileSyncStub.restore()
})

t.test('logs any errors parsing when in debug and override mode', ct => {
  ct.plan(1)

  const logStub = sinon.stub(console, 'log')

  dotenv.config({ debug: true, override: true })

  ct.ok(logStub.called)

  logStub.restore()
})
