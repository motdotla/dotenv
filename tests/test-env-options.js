const t = require('tap')
const decache = require('decache')

// warm cache
require('../lib/env-options')

// preserve existing env
const e = process.env.DOTENV_CONFIG_ENCODING
const p = process.env.DOTENV_CONFIG_PATH
const d = process.env.DOTENV_CONFIG_DEBUG
const o = process.env.DOTENV_CONFIG_OVERRIDE
const dk = process.env.DOTENV_CONFIG_DOTENV_KEY

// get fresh object for each test
function options () {
  decache('../lib/env-options.js')
  return require('../lib/env-options')
}

function testOption (envVar, tmpVal, expect) {
  delete process.env[envVar]
  process.env[envVar] = tmpVal

  t.same(options(), expect)

  delete process.env[envVar]
}

// returns empty object when no options set in process.env
delete process.env.DOTENV_CONFIG_ENCODING
delete process.env.DOTENV_CONFIG_PATH
delete process.env.DOTENV_CONFIG_DEBUG
delete process.env.DOTENV_CONFIG_OVERRIDE
delete process.env.DOTENV_CONFIG_DOTENV_KEY

t.same(options(), {})

// sets encoding option
testOption('DOTENV_CONFIG_ENCODING', 'latin1', { encoding: 'latin1' })

// sets path option
testOption('DOTENV_CONFIG_PATH', '~/.env.test', { path: '~/.env.test' })

// sets debug option
testOption('DOTENV_CONFIG_DEBUG', 'true', { debug: 'true' })

// sets override option
testOption('DOTENV_CONFIG_OVERRIDE', 'true', { override: 'true' })

// sets DOTENV_KEY option
testOption('DOTENV_CONFIG_DOTENV_KEY', 'dotenv://:key_ddcaa26504cd70a@dotenvx.com/vault/.env.vault?environment=development', { DOTENV_KEY: 'dotenv://:key_ddcaa26504cd70a@dotenvx.com/vault/.env.vault?environment=development' })

// restore existing env
process.env.DOTENV_CONFIG_ENCODING = e
process.env.DOTENV_CONFIG_PATH = p
process.env.DOTENV_CONFIG_DEBUG = d
process.env.DOTENV_CONFIG_OVERRIDE = o
process.env.DOTENV_CONFIG_DOTENV_KEY = dk
