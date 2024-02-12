const fs = require('fs')
const crypto = require('crypto')
const sinon = require('sinon')
const t = require('tap')

const dotenv = require('../lib/main')

const testPath = 'tests/.env'

const dotenvKey = 'dotenv://:key_ddcaa26504cd70a6fef9801901c3981538563a1767c297cb8416e8a38c62fe00@dotenvx.com/vault/.env.vault?environment=development'

let envStub
let logStub

t.beforeEach(() => {
  process.env.DOTENV_KEY = ''
  envStub = sinon.stub(process.env, 'DOTENV_KEY').value(dotenvKey)
})

t.afterEach(() => {
  envStub.restore()

  if (logStub) {
    logStub.restore()
  }
})

t.test('logs when no path is set', ct => {
  ct.plan(1)

  logStub = sinon.stub(console, 'log')

  dotenv.config()
  ct.ok(logStub.called)
})

t.test('logs', ct => {
  ct.plan(1)

  logStub = sinon.stub(console, 'log')

  dotenv.config({ path: testPath })
  ct.ok(logStub.called)
})

t.test('logs when testPath calls to .env.vault directly (interpret what the user meant)', ct => {
  ct.plan(1)

  logStub = sinon.stub(console, 'log')

  dotenv.config({ path: `${testPath}.vault` })
  ct.ok(logStub.called)
})

t.test('warns if DOTENV_KEY exists but .env.vault does not exist', ct => {
  ct.plan(1)

  logStub = sinon.stub(console, 'log')

  const existsSync = sinon.stub(fs, 'existsSync').returns(false) // make .env.vault not exist
  dotenv.config({ path: testPath })
  ct.ok(logStub.called)
  existsSync.restore()

  ct.end()
})

t.test('warns if DOTENV_KEY exists but .env.vault does not exist (set as array)', ct => {
  ct.plan(1)

  logStub = sinon.stub(console, 'log')

  const existsSync = sinon.stub(fs, 'existsSync').returns(false) // make .env.vault not exist
  dotenv.config({ path: [testPath] })
  ct.ok(logStub.called)
  existsSync.restore()

  ct.end()
})

t.test('returns parsed object', ct => {
  ct.plan(1)

  const env = dotenv.config({ path: testPath })
  ct.same(env.parsed, { ALPHA: 'zeta' })

  ct.end()
})

t.test('returns parsed object (set path as array)', ct => {
  ct.plan(1)

  const env = dotenv.config({ path: [testPath] })
  ct.same(env.parsed, { ALPHA: 'zeta' })

  ct.end()
})

t.test('returns parsed object (set path as mulit-array)', ct => {
  ct.plan(1)

  const env = dotenv.config({ path: ['tests/.env.local', 'tests/.env'] })
  ct.same(env.parsed, { ALPHA: 'zeta' })

  ct.end()
})

t.test('returns parsed object (set path as array with .vault extension)', ct => {
  ct.plan(1)

  const env = dotenv.config({ path: [`${testPath}.vault`] })
  ct.same(env.parsed, { ALPHA: 'zeta' })

  ct.end()
})

t.test('throws not found if .env.vault is empty', ct => {
  ct.plan(2)

  const readFileSync = sinon.stub(fs, 'readFileSync').returns('') // empty file

  try {
    dotenv.config({ path: testPath })
  } catch (e) {
    ct.equal(e.message, 'NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment DOTENV_VAULT_DEVELOPMENT in your .env.vault file.')
    ct.equal(e.code, 'NOT_FOUND_DOTENV_ENVIRONMENT')
  }

  readFileSync.restore()
  ct.end()
})

t.test('throws missing data when somehow parsed badly', ct => {
  ct.plan(2)

  const configDotenvStub = sinon.stub(dotenv, 'configDotenv').returns({ parsed: undefined })

  try {
    dotenv.config({ path: testPath })
  } catch (e) {
    ct.equal(e.message, 'MISSING_DATA: Cannot parse tests/.env.vault for an unknown reason')
    ct.equal(e.code, 'MISSING_DATA')
  }

  configDotenvStub.restore()
  ct.end()
})

t.test('throws error when invalid formed DOTENV_KEY', ct => {
  envStub.restore()
  envStub = sinon.stub(process.env, 'DOTENV_KEY').value('invalid-format-non-uri-format')

  ct.plan(2)

  try {
    dotenv.config({ path: testPath })
  } catch (e) {
    ct.equal(e.message, 'INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development')
    ct.equal(e.code, 'INVALID_DOTENV_KEY')
  }

  ct.end()
})

t.test('throws error when invalid formed DOTENV_KEY that otherwise is not caught', ct => {
  ct.plan(1)

  const urlStub = sinon.stub(global, 'URL')
  urlStub.callsFake(() => {
    throw new Error('uncaught error')
  })

  try {
    dotenv.config({ path: testPath })
  } catch (e) {
    ct.equal(e.message, 'uncaught error')
  }

  urlStub.restore()
  ct.end()
})

t.test('throws error when DOTENV_KEY missing password', ct => {
  envStub.restore()
  envStub = sinon.stub(process.env, 'DOTENV_KEY').value('dotenv://username@dotenvx.com/vault/.env.vault?environment=development')

  ct.plan(2)

  try {
    dotenv.config({ path: testPath })
  } catch (e) {
    ct.equal(e.message, 'INVALID_DOTENV_KEY: Missing key part')
    ct.equal(e.code, 'INVALID_DOTENV_KEY')
  }

  ct.end()
})

t.test('throws error when DOTENV_KEY missing environment', ct => {
  envStub.restore()
  envStub = sinon.stub(process.env, 'DOTENV_KEY').value('dotenv://:key_ddcaa26504cd70a6fef9801901c3981538563a1767c297cb8416e8a38c62fe00@dotenvx.com/vault/.env.vault')

  ct.plan(2)

  try {
    dotenv.config({ path: testPath })
  } catch (e) {
    ct.equal(e.message, 'INVALID_DOTENV_KEY: Missing environment part')
    ct.equal(e.code, 'INVALID_DOTENV_KEY')
  }

  ct.end()
})

t.test('when DOTENV_KEY is empty string falls back to .env file', ct => {
  envStub.restore()
  envStub = sinon.stub(process.env, 'DOTENV_KEY').value('')

  ct.plan(1)

  const result = dotenv.config({ path: testPath })
  ct.equal(result.parsed.BASIC, 'basic')

  ct.end()
})

t.test('does not write over keys already in process.env by default', ct => {
  ct.plan(2)

  const existing = 'bar'
  process.env.ALPHA = existing

  const result = dotenv.config({ path: testPath })

  ct.equal(result.parsed.ALPHA, 'zeta')
  ct.equal(process.env.ALPHA, 'bar')
})

t.test('does write over keys already in process.env if override turned on', ct => {
  ct.plan(2)

  const existing = 'bar'
  process.env.ALPHA = existing

  const result = dotenv.config({ path: testPath, override: true })

  ct.equal(result.parsed.ALPHA, 'zeta')
  ct.equal(process.env.ALPHA, 'zeta')
})

t.test('when DOTENV_KEY is passed as an option it successfully decrypts and injects', ct => {
  envStub.restore()
  envStub = sinon.stub(process.env, 'DOTENV_KEY').value('')

  ct.plan(2)

  const result = dotenv.config({ path: testPath, DOTENV_KEY: dotenvKey })

  ct.equal(result.parsed.ALPHA, 'zeta')
  ct.equal(process.env.ALPHA, 'zeta')

  ct.end()
})

t.test('can write to a different object rather than process.env', ct => {
  ct.plan(3)

  process.env.ALPHA = 'other' // reset process.env

  logStub = sinon.stub(console, 'log')

  const myObject = {}

  const result = dotenv.config({ path: testPath, processEnv: myObject })
  ct.equal(result.parsed.ALPHA, 'zeta')
  ct.equal(process.env.ALPHA, 'other')
  ct.equal(myObject.ALPHA, 'zeta')
})

t.test('logs when debug and override are turned on', ct => {
  ct.plan(1)

  logStub = sinon.stub(console, 'log')

  dotenv.config({ path: testPath, override: true, debug: true })

  ct.ok(logStub.called)
})

t.test('logs when debug is on and override is false', ct => {
  ct.plan(1)

  logStub = sinon.stub(console, 'log')

  dotenv.config({ path: testPath, override: false, debug: true })

  ct.ok(logStub.called)
})

t.test('raises an INVALID_DOTENV_KEY if key RangeError', ct => {
  envStub.restore()
  envStub = sinon.stub(process.env, 'DOTENV_KEY').value('dotenv://:key_ddcaa26504cd70a@dotenvx.com/vault/.env.vault?environment=development')

  ct.plan(2)

  try {
    dotenv.config({ path: testPath })
  } catch (e) {
    ct.equal(e.message, 'INVALID_DOTENV_KEY: It must be 64 characters long (or more)')
    ct.equal(e.code, 'INVALID_DOTENV_KEY')
  }

  ct.end()
})

t.test('raises an DECRYPTION_FAILED if key fails to decrypt payload', ct => {
  envStub.restore()
  envStub = sinon.stub(process.env, 'DOTENV_KEY').value('dotenv://:key_2c4d267b8c3865f921311612e69273666cc76c008acb577d3e22bc3046fba386@dotenvx.com/vault/.env.vault?environment=development')

  ct.plan(2)

  try {
    dotenv.config({ path: testPath })
  } catch (e) {
    ct.equal(e.message, 'DECRYPTION_FAILED: Please check your DOTENV_KEY')
    ct.equal(e.code, 'DECRYPTION_FAILED')
  }

  ct.end()
})

t.test('raises an DECRYPTION_FAILED if both (comma separated) keys fail to decrypt', ct => {
  envStub.restore()
  envStub = sinon.stub(process.env, 'DOTENV_KEY').value('dotenv://:key_2c4d267b8c3865f921311612e69273666cc76c008acb577d3e22bc3046fba386@dotenvx.com/vault/.env.vault?environment=development,dotenv://:key_c04959b64473e43dd60c56a536ef8481388528b16759736d89515c25eec69247@dotenvx.com/vault/.env.vault?environment=development')

  ct.plan(2)

  try {
    dotenv.config({ path: testPath })
  } catch (e) {
    ct.equal(e.message, 'DECRYPTION_FAILED: Please check your DOTENV_KEY')
    ct.equal(e.code, 'DECRYPTION_FAILED')
  }

  ct.end()
})

t.test('raises error if some other uncaught decryption error', ct => {
  ct.plan(1)

  const decipherStub = sinon.stub(crypto, 'createDecipheriv')
  decipherStub.callsFake(() => {
    throw new Error('uncaught error')
  })

  try {
    dotenv.config({ path: testPath })
  } catch (e) {
    ct.equal(e.message, 'uncaught error')
  }

  decipherStub.restore()

  ct.end()
})
