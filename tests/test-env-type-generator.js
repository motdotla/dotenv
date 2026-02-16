const fs = require('fs')
const path = require('path')
const generate = require('../lib/env-type-generator')
const tap = require('tap')

const TEST_ENV_FILE = path.resolve(__dirname, '.env.test.gen')
const TEST_OUTPUT_FILE = path.resolve(__dirname, 'env.test.d.ts')

tap.test('generate types', (t) => {
  // Setup
  fs.writeFileSync(TEST_ENV_FILE, 'TEST_VAR=hello\nANOTHER_VAR=world')

  // Execute
  generate({ path: TEST_ENV_FILE, output: TEST_OUTPUT_FILE })

  // Verify
  const content = fs.readFileSync(TEST_OUTPUT_FILE, 'utf8')
  t.ok(content.includes('TEST_VAR: string;'), 'contains TEST_VAR')
  t.ok(content.includes('ANOTHER_VAR: string;'), 'contains ANOTHER_VAR')
  t.ok(content.includes('namespace NodeJS'), 'contains namespace NodeJS')
  t.ok(content.includes('interface ProcessEnv'), 'contains interface ProcessEnv')

  // Cleanup
  fs.unlinkSync(TEST_ENV_FILE)
  fs.unlinkSync(TEST_OUTPUT_FILE)

  t.end()
})
