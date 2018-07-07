const t = require('tap')

const options = require('../lib/cli-options')

t.plan(4)

// matches encoding option
t.same(options(['node', '-e', "'console.log(testing)'", 'dotenv_config_encoding=utf8']), {
  encoding: 'utf8'
})

// matches path option
t.same(options(['node', '-e', "'console.log(testing)'", 'dotenv_config_path=/custom/path/to/your/env/vars']), {
  path: '/custom/path/to/your/env/vars'
})

// ignores empty values
t.same(options(['node', '-e', "'console.log(testing)'", 'dotenv_config_path=']), {})

// ignores unsupported options
t.same(options(['node', '-e', "'console.log(testing)'", 'dotenv_config_foo=bar']), {})
