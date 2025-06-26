const t = require('tap')

const options = require('../lib/cli-options')

// matches encoding option
t.same(options(['node', '-e', "'console.log(testing)'", 'dotenv_config_encoding=utf8']), {
  encoding: 'utf8',
  quiet: 'true'
})

// matches path option
t.same(options(['node', '-e', "'console.log(testing)'", 'dotenv_config_path=/custom/path/to/your/env/vars']), {
  path: '/custom/path/to/your/env/vars',
  quiet: 'true'
})

// matches debug option
t.same(options(['node', '-e', "'console.log(testing)'", 'dotenv_config_debug=true']), {
  debug: 'true',
  quiet: 'true'
})

// matches override option
t.same(options(['node', '-e', "'console.log(testing)'", 'dotenv_config_override=true']), {
  override: 'true',
  quiet: 'true'
})

// ignores empty values
t.same(options(['node', '-e', "'console.log(testing)'", 'dotenv_config_path=']), { quiet: 'true' })

// ignores unsupported options
t.same(options(['node', '-e', "'console.log(testing)'", 'dotenv_config_foo=bar']), { quiet: 'true' })
