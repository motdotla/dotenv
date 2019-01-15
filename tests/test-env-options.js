/* @flow */

const t = require('tap')
const decache = require('decache')

// warm cache
require('../lib/env-options')

// preserve existing env
const e = process.env.DOTENV_CONFIG_ENCODING
const p = process.env.DOTENV_CONFIG_PATH
const d = process.env.DOTENV_CONFIG_DEBUG

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

t.plan(4)

// returns empty object when no options set in process.env
delete process.env.DOTENV_CONFIG_ENCODING
delete process.env.DOTENV_CONFIG_PATH
delete process.env.DOTENV_CONFIG_DEBUG

t.same(options(), {})

// sets encoding option
testOption('DOTENV_CONFIG_ENCODING', 'latin1', { encoding: 'latin1' })

// sets path option
testOption('DOTENV_CONFIG_PATH', '~/.env.test', { path: '~/.env.test' })

// sets debug option
testOption('DOTENV_CONFIG_DEBUG', 'true', { debug: 'true' })

// restore existing env
process.env.DOTENV_CONFIG_ENCODING = e
process.env.DOTENV_CONFIG_PATH = p
process.env.DOTENV_CONFIG_DEBUG = d
