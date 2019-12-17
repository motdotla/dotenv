/* @flow */

const t = require('tap')
const decache = require('decache')

// warm cache
require('../lib/env-options')

// preserve existing env
const e = process.env.DOTENV_CONFIG_ENCODING
const p = process.env.DOTENV_CONFIG_PATH
const d = process.env.DOTENV_CONFIG_DEBUG
const ep = process.env.DOTENV_CONFIG_EXAMPLE_PATH
const dp = process.env.DOTENV_CONFIG_DEFAULT_PATH
const x = process.env.DOTENV_CONFIG_EXTENDED

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

t.plan(7)

// returns empty object when no options set in process.env
delete process.env.DOTENV_CONFIG_ENCODING
delete process.env.DOTENV_CONFIG_PATH
delete process.env.DOTENV_CONFIG_DEBUG
delete process.env.DOTENV_CONFIG_EXAMPLE_PATH
delete process.env.DOTENV_CONFIG_DEFAULT_PATH
delete process.env.DOTENV_CONFIG_EXTENDED

t.same(options(), {})

// sets encoding option
testOption('DOTENV_CONFIG_ENCODING', 'latin1', { encoding: 'latin1' })

// sets path option
testOption('DOTENV_CONFIG_PATH', '~/.env.test', { path: '~/.env.test' })

// sets debug option
testOption('DOTENV_CONFIG_DEBUG', 'true', { debug: 'true' })

// sets example path option
testOption('DOTENV_CONFIG_EXAMPLE_PATH', '~/.env.example', { examplePath: '~/.env.example' })

// sets default path option
testOption('DOTENV_CONFIG_DEFAULT_PATH', '~/.env.default', { defaultPath: '~/.env.default' })

// sets extended option
testOption('DOTENV_CONFIG_EXTENDED', 'true', { extended: 'true' })

// restore existing env
process.env.DOTENV_CONFIG_ENCODING = e
process.env.DOTENV_CONFIG_PATH = p
process.env.DOTENV_CONFIG_DEBUG = d
process.env.DOTENV_CONFIG_EXAMPLE_PATH = ep
process.env.DOTENV_CONFIG_DEFAULT_PATH = dp
process.env.DOTENV_CONFIG_EXTENDED = x
