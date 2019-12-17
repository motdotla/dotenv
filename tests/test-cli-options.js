/* @flow */

const t = require('tap')

const options = require('../lib/cli-options')

t.plan(8)

// matches encoding option
t.same(options(['node', '-e', "'console.log(testing)'", 'dotenv_config_encoding=utf8']), {
  encoding: 'utf8'
})

// matches path option
t.same(options(['node', '-e', "'console.log(testing)'", 'dotenv_config_path=/custom/path/to/your/env/vars']), {
  path: '/custom/path/to/your/env/vars'
})

// matches debug option
t.same(options(['node', '-e', "'console.log(testing)'", 'dotenv_config_debug=true']), {
  debug: 'true'
})

// matches example path option
t.same(options(['node', '-e', "'console.log(testing)'", 'dotenv_config_example_path=/path/to/.env.example']), {
  examplePath: '/path/to/.env.example'
})

// matches default path option
t.same(options(['node', '-e', "'console.log(testing)'", 'dotenv_config_default_path=/path/to/.env.default']), {
  defaultPath: '/path/to/.env.default'
})

// matches extended option
t.same(options(['node', '-e', "'console.log(testing)'", 'dotenv_config_extended=true']), {
  extended: 'true'
})

// ignores empty values
t.same(options(['node', '-e', "'console.log(testing)'", 'dotenv_config_path=']), {})

// ignores unsupported options
t.same(options(['node', '-e', "'console.log(testing)'", 'dotenv_config_foo=bar']), {})
