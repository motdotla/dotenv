const cp = require('child_process')
const path = require('path')

const test = require('tap').test

const nodeBinary = process.argv[0]

test('config preload loads .env', t => {
  t.plan(1)

  // NB: `nodeBinary` is quoted for Windows
  const stdout = cp.execSync(
    '"' + nodeBinary + '" -r ../config -e "console.log(process.env.BASIC)" dotenv_config_encoding=utf8',
    {
      cwd: path.resolve(__dirname),
      timeout: 500,
      encoding: 'utf8'
    }
  )

  t.equal(stdout.trim(), 'basic')
})
