const t = require('tap')

const options = require('../lib/cli-options')

t.plan(3)

t.same(options(['node', '-e', "'console.log(testing)'", 'dotenv_config_encoding=utf8']), {
  encoding: 'utf8'
})

t.same(options(['node', '-e', "'console.log(testing)'", 'dotenv_config_path=/custom/path/to/your/env/vars']), {
  path: '/custom/path/to/your/env/vars'
})

t.same(options(['node', 'dotenv_config_path=', 'dotenv_config_foo=.']), {
  foo: '.'
})
