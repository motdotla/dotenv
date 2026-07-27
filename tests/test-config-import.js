const cp = require('child_process')
const path = require('path')
const t = require('tap')

t.test("import 'dotenv/config' loads env before application code", ct => {
  const result = cp.spawnSync(process.execPath, [
    '--input-type=module',
    '--eval',
    "import 'dotenv/config'; console.log(process.env.BASIC)"
  ], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    env: {
      ...process.env,
      DOTENV_CONFIG_PATH: 'tests/.env',
      DOTENV_CONFIG_QUIET: 'true'
    }
  })

  ct.equal(result.status, 0)
  ct.equal(result.stdout, 'basic\n')
  ct.equal(result.stderr, '')
  ct.end()
})
