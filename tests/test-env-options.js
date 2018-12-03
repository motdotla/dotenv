/* @flow */

const t = require('tap')

const options = require('../lib/env-options')

t.plan(6)

// matches encoding option
t.same(options({ DOTENV_CONFIG_ENCODING: 'utf8' }), {
  encoding: 'utf8'
})

// matches path option
t.same(options({ DOTENV_CONFIG_PATH: '/custom/path/to/your/env/vars' }), {
  path: '/custom/path/to/your/env/vars'
})

// matches debug option
t.same(options({ DOTENV_CONFIG_DEBUG: 'true' }), {
  debug: 'true'
})

// ignores empty values
t.same(options(), {})
t.same(options({}), {})

// ignores unsupported options
t.same(options({ DOTENV_CONFIG_FOO: 'foo' }), {})
