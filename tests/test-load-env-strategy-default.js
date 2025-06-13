const t = require('tap')

// load functions
const getRootEnvByDefaultStrategy = require('./fixtures/strategy-nearest/load-env-default-strategy.js')
const getNestedEnvByDefaultStrategy = require('./fixtures/strategy-nearest/nested/load-env-default-strategy.js')

t.test('default config loads .env from current dir only', t => {
  t.equal(getRootEnvByDefaultStrategy(), undefined, '.env doesnt loads as strategy is not mentioned')
  t.equal(getNestedEnvByDefaultStrategy(), undefined, '.env doesnt loads as strategy is not mentioned')
  t.end()
})
