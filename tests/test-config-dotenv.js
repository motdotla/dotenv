const sinon = require('sinon')
const t = require('tap')

const dotenv = require('../lib/main')

let logStub

t.beforeEach(() => {
  logStub = null
  delete process.env.BASIC
})

t.afterEach(() => {
  if (logStub) logStub.restore()
})

t.test('configDotenv reads .env file and sets process.env', ct => {
  const testPath = 'tests/.env'
  const env = dotenv.configDotenv({ path: testPath })

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(process.env.BASIC, 'basic')

  ct.end()
})

t.test('configDotenv returns parsed object', ct => {
  const testPath = 'tests/.env'
  const env = dotenv.configDotenv({ path: testPath })

  ct.notOk(env.error)
  ct.equal(env.parsed.BASIC, 'basic')

  ct.end()
})

t.test('configDotenv does not override existing env vars by default', ct => {
  const testPath = 'tests/.env'
  process.env.BASIC = 'existing'
  const env = dotenv.configDotenv({ path: testPath })

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(process.env.BASIC, 'existing')

  ct.end()
})

t.test('configDotenv overrides env vars when override is true', ct => {
  const testPath = 'tests/.env'
  process.env.BASIC = 'existing'
  const env = dotenv.configDotenv({ path: testPath, override: true })

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(process.env.BASIC, 'basic')

  ct.end()
})

t.test('configDotenv accepts array of paths', ct => {
  const testPath = ['tests/.env.local', 'tests/.env']
  const env = dotenv.configDotenv({ path: testPath })

  ct.equal(env.parsed.BASIC, 'local_basic')
  ct.equal(process.env.BASIC, 'local_basic')

  ct.end()
})

t.test('configDotenv writes to custom processEnv object', ct => {
  const testPath = 'tests/.env'
  process.env.BASIC = 'other'

  const myObject = {}
  const env = dotenv.configDotenv({ path: testPath, processEnv: myObject })

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(process.env.BASIC, 'other')
  ct.equal(myObject.BASIC, 'basic')

  ct.end()
})

t.test('configDotenv returns error for missing file', ct => {
  logStub = sinon.stub(console, 'log')

  const env = dotenv.configDotenv({ path: '/nonexistent/.env' })

  ct.type(env.error, Error)
  ct.ok(env.parsed)

  ct.end()
})

t.test('configDotenv ignores DOTENV_KEY (always reads .env file)', ct => {
  process.env.DOTENV_KEY = 'dotenv://:key_fake@dotenvx.com/vault/.env.vault?environment=development'

  const testPath = 'tests/.env'
  const env = dotenv.configDotenv({ path: testPath })

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(process.env.BASIC, 'basic')

  delete process.env.DOTENV_KEY
  ct.end()
})
