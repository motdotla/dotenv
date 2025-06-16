const t = require('tap')
const fs = require('fs')
const path = require('path')
const { _vaultPath } = require('../lib/main')

const testDir = path.join(__dirname, 'envtest')
const fakePath = path.join(testDir, '.fake.env')
const validPath = path.join(testDir, '.real.env.vault')

// Setup
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir)
}
fs.writeFileSync(validPath, 'DOTENV_VAULT_PRODUCTION="fake"')

// Should return the first existing vault path
t.equal(
  _vaultPath({ path: [fakePath, path.join(testDir, '.real.env')] }),
  validPath,
  'returns first matching .env.vault path from array'
)

// Teardown
fs.unlinkSync(validPath)
fs.rmdirSync(testDir)
