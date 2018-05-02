const cp = require('child_process')

const test = require('tap').test

const nodeBinary = process.argv[0]

test('config preload loads .env', t => {
  t.plan(2)
  // NB: `nodeBinary` is quoted for Windows
  cp.exec(
    '"' + nodeBinary + '" -r ../config -e "console.log(process.env.BASIC)" dotenv_config_path=./tests/.env',
    function (err, stdout) {
      t.error(err)
      t.equal(stdout.trim(), 'basic')
    }
  )
})
