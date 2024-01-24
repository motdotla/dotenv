const fs = require('fs')
// const os = require('os')
// const path = require('path')

const sinon = require('sinon')
const t = require('tap')

const dotenv = require('../lib/main')

const mockParseResponse = { test: 'foo' }

t.test('takes string for path option', ct => {
  ct.plan(2)

  const testPath = 'tests/.env'
  const env = dotenv.config({ path: testPath })

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(process.env.BASIC, 'basic')
})

t.test('takes array for path option', ct => {
  ct.plan(2)

  const testPath = ['tests/.env']
  const env = dotenv.config({ path: testPath })

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(process.env.BASIC, 'basic')
})

t.test('takes two or more files in the array for path option', ct => {
  ct.plan(2)

  const testPath = ['tests/.env.local', 'tests/.env']
  const env = dotenv.config({ path: testPath })

  ct.equal(env.parsed.BASIC, 'local_basic')
  ct.equal(process.env.BASIC, 'local_basic')
})

t.test('takes URL for path option', ct => {
  ct.plan(2)

  const testPath = new URL('file://home/user/project/.env')
  const env = dotenv.config({ path: testPath })

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(process.env.BASIC, 'basic')
})

// t.test('takes option for path along with home directory char ~', ct => {
//   ct.plan(2)
//   const mockedHomedir = '/Users/dummy'
//   const homedirStub = sinon.stub(os, 'homedir').returns(mockedHomedir)
//   const testPath = '~/.env'
//   dotenv.config({ path: testPath })
//
//   ct.equal(readFileSyncStub.args[0][0], path.join(mockedHomedir, '.env'))
//   ct.ok(homedirStub.called)
//   homedirStub.restore()
// })

t.test('takes option for encoding', ct => {
  ct.plan(1)

  const testEncoding = 'latin1'
  dotenv.config({ encoding: testEncoding })

  const readFileSyncStub = sinon.stub(fs, 'readFileSync').returns('test=foo')

  ct.equal(readFileSyncStub.args[0][1].encoding, testEncoding)
  readFileSyncStub.restore()
})

t.test('takes option for debug', ct => {
  ct.plan(1)

  const logStub = sinon.stub(console, 'log')
  dotenv.config({ debug: 'true' })

  ct.ok(logStub.called)
  logStub.restore()
})

t.test('reads path with encoding, parsing output to process.env', ct => {
  ct.plan(2)

  const env = dotenv.config()

  ct.same(env.parsed.BASIC, 'basic')
  ct.same(process.env.BASIC, 'basic')
})

t.test('does not write over keys already in process.env', ct => {
  ct.plan(2)

  const existing = 'bar'
  process.env.BASIC = existing
  const env = dotenv.config()

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(process.env.BASIC, existing)
})

t.test('does write over keys already in process.env if override turned on', ct => {
  ct.plan(2)

  const existing = 'bar'
  process.env.BASIC = existing
  const env = dotenv.config({ override: true })

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(process.env.BASIC, 'basic')
})

t.test('does not write over keys already in process.env if the key has a falsy value', ct => {
  ct.plan(2)

  const existing = ''
  process.env.BASIC = existing
  const env = dotenv.config()

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(process.env.BASIC, undefined)
})

t.test('does write over keys already in process.env if the key has a falsy value but override is set to true', ct => {
  ct.plan(2)

  const existing = ''
  process.env.BASIC = existing
  // 'foo' returned as value in `beforeEach`. should keep this ''
  const env = dotenv.config({ override: true })

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(process.env.BASIC, '')
  // ct.ok(process.env.test)
})

t.test('can write to a different object rather than process.env', ct => {
  ct.plan(3)

  process.env.BASIC = 'other' // reset process.env

  const myObject = {}
  const env = dotenv.config({ processEnv: myObject })

  ct.equal(env.parsed.BASIC, 'basic')
  console.log('logging', process.env.BASIC)
  ct.equal(process.env.BASIC, 'other')
  ct.equal(myObject.BASIC, 'basic')
})

t.test('returns parsed object', ct => {
  ct.plan(2)

  const env = dotenv.config()

  ct.notOk(env.error)
  ct.same(env.parsed, mockParseResponse)
})

t.test('returns any errors thrown from reading file or parsing', ct => {
  ct.plan(1)

  const readFileSyncStub = sinon.stub(fs, 'readFileSync').returns('test=foo')

  readFileSyncStub.throws()
  const env = dotenv.config()

  ct.type(env.error, Error)

  readFileSyncStub.restore()
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
