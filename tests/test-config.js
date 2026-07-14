const fs = require('fs')
const os = require('os')
const path = require('path')
const sinon = require('sinon')
const t = require('tap')

const dotenv = require('../lib/main')

let logStub

t.beforeEach(() => {
  logStub = null
  delete process.env.BASIC // reset
})

t.afterEach(() => {
  if (logStub) logStub.restore()
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
  logStub = sinon.stub(console, 'log')

  dotenv.config({ debug: 'true' })
  ct.ok(logStub.called)

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

  logStub = sinon.stub(console, 'log')
  const readFileSyncStub = sinon.stub(fs, 'readFileSync').returns('test=foo')

  readFileSyncStub.throws()
  const env = dotenv.config({ debug: true })

  ct.ok(logStub.called)
  ct.type(env.error, Error)

  readFileSyncStub.restore()
})

t.test('logs any errors parsing when in debug and override mode', ct => {
  ct.plan(1)

  logStub = sinon.stub(console, 'log')

  dotenv.config({ debug: true, override: true })

  ct.ok(logStub.called)
})

t.test('deals with file:// path', ct => {
  logStub = sinon.stub(console, 'log')

  const testPath = 'file:///tests/.env'
  const env = dotenv.config({ path: testPath })

  ct.equal(env.parsed.BASIC, undefined)
  ct.equal(process.env.BASIC, undefined)
  ct.equal(env.error.message, "ENOENT: no such file or directory, open 'file:///tests/.env'")

  ct.ok(logStub.called)

  ct.end()
})

t.test('deals with file:// path and debug true', ct => {
  logStub = sinon.stub(console, 'log')

  const testPath = 'file:///tests/.env'
  const env = dotenv.config({ path: testPath, debug: true })

  ct.equal(env.parsed.BASIC, undefined)
  ct.equal(process.env.BASIC, undefined)
  ct.equal(env.error.message, "ENOENT: no such file or directory, open 'file:///tests/.env'")

  ct.ok(logStub.called)

  ct.end()
})

t.test('path.relative fails somehow', ct => {
  logStub = sinon.stub(console, 'log')
  const pathRelativeStub = sinon.stub(path, 'relative').throws(new Error('fail'))

  const testPath = 'file:///tests/.env'
  const env = dotenv.config({ path: testPath, debug: true })

  ct.equal(env.parsed.BASIC, undefined)
  ct.equal(process.env.BASIC, undefined)
  ct.equal(env.error.message, 'fail')

  ct.ok(logStub.called)

  pathRelativeStub.restore()

  ct.end()
})

t.test('displays the injected env message without tips', ct => {
  ct.plan(1)
  logStub = sinon.stub(console, 'log')
  const testPath = 'tests/.env'

  dotenv.config({ path: testPath })

  ct.match(logStub.firstCall.args[0], /^◇ injected env \(\d+\) from tests\/\.env$/)
  ct.end()
})

t.test('logs when no path is set', ct => {
  ct.plan(1)

  logStub = sinon.stub(console, 'log')

  dotenv.config()
  ct.ok(logStub.called)
})

t.test('does log by default', ct => {
  ct.plan(1)

  const testPath = 'tests/.env'
  logStub = sinon.stub(console, 'log')

  dotenv.config({ path: testPath })
  ct.ok(logStub.called)
})

t.test('does not log if quiet flag passed true', ct => {
  ct.plan(1)

  const testPath = 'tests/.env'
  logStub = sinon.stub(console, 'log')

  dotenv.config({ path: testPath, quiet: true })
  ct.ok(logStub.notCalled)
})

t.test('does not log if process.env.DOTENV_CONFIG_QUIET is true', ct => {
  ct.plan(1)

  process.env.DOTENV_CONFIG_QUIET = 'true'
  const testPath = 'tests/.env'
  logStub = sinon.stub(console, 'log')

  dotenv.config({ path: testPath })
  ct.ok(logStub.notCalled)
  delete process.env.DOTENV_CONFIG_QUIET
})

t.test('does log if quiet flag false', ct => {
  ct.plan(1)

  const testPath = 'tests/.env'
  logStub = sinon.stub(console, 'log')

  dotenv.config({ path: testPath, quiet: false })
  ct.ok(logStub.called)
})

t.test('does log if process.env.DOTENV_CONFIG_QUIET is false', ct => {
  ct.plan(1)

  process.env.DOTENV_CONFIG_QUIET = 'false'
  const testPath = 'tests/.env'
  logStub = sinon.stub(console, 'log')

  dotenv.config({ path: testPath })
  ct.ok(logStub.called)
  delete process.env.DOTENV_CONFIG_QUIET
})

t.test('does log if quiet flag present and undefined/null', ct => {
  ct.plan(1)

  const testPath = 'tests/.env'
  logStub = sinon.stub(console, 'log')

  dotenv.config({ path: testPath, quiet: undefined })
  ct.ok(logStub.called)
})

t.test('logs if debug set', ct => {
  ct.plan(1)

  const testPath = 'tests/.env'
  logStub = sinon.stub(console, 'log')

  dotenv.config({ path: testPath, debug: true })
  ct.ok(logStub.called)
})
