const t = require('tap')

const options = require('../lib/cli-options')

t.plan(1)

t.same(options(['node', '-e', "'console.log(testing)'", 'dotenv_config_encoding=utf8']), {
  encoding: 'utf8'
})
