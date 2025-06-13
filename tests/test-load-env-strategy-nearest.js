const t = require('tap')

// load functions
const getRootEnvByNearestStrategy = require('./fixtures/strategy-nearest/load-env-nearest-strategy.js')
const getNestedEnvByNearestStrategy = require('./fixtures/strategy-nearest/nested/load-env-nearest-strategy.js')

t.test('default config loads .env from current dir only', t => {
  t.equal(getRootEnvByNearestStrategy(), 'Hello from root', '.env loads from parent directory after strategy is mentioned')
  t.equal(getNestedEnvByNearestStrategy(), 'Hello from root', '.env loads for nested files from parent directory after strategy is mentioned')
  t.end()
})
