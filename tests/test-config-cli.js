const cp = require('child_process')
const path = require('path')

const t = require('tap')

function spawn (cmd, options = {}) {
  const { stdout } = cp.spawnSync(
    process.argv[0], // node binary
    cmd,
    Object.assign(
      {},
      {
        cwd: path.resolve(__dirname, '..'),
        timeout: 5000,
        encoding: 'utf8'
      },
      options
    )
  )

  return stdout
}

function spawnResult (cmd, options = {}) {
  return cp.spawnSync(
    process.argv[0], // node binary
    cmd,
    Object.assign(
      {},
      {
        cwd: path.resolve(__dirname, '..'),
        timeout: 5000,
        encoding: 'utf8'
      },
      options
    )
  )
}

t.plan(7)

// dotenv/config enables preloading
t.equal(
  spawn(
    [
      '-r',
      './config',
      '-e',
      'console.log(process.env.BASIC)',
      'dotenv_config_encoding=utf8',
      'dotenv_config_path=./tests/.env'
    ]
  ),
  'basic\n'
)

// dotenv/config supports configuration via environment variables
t.equal(
  spawn(
    [
      '-r',
      './config',
      '-e',
      'console.log(process.env.BASIC)'
    ],
    {
      env: {
        DOTENV_CONFIG_PATH: './tests/.env'
      }
    }
  ),
  'basic\n'
)

// dotenv/config takes CLI configuration over environment variables
t.equal(
  spawn(
    [
      '-r',
      './config',
      '-e',
      'console.log(process.env.BASIC)',
      'dotenv_config_path=./tests/.env'
    ],
    {
      env: {
        DOTENV_CONFIG_PATH: '/tmp/dne/path/.env.should.break'
      }
    }
  ),
  'basic\n'
)

// dotenv/config defaults quiet to true (suppresses log output)
const quietResult = spawnResult(
  [
    '-r',
    './config',
    '-e',
    'console.log(process.env.BASIC)',
    'dotenv_config_path=./tests/.env'
  ]
)
t.equal(quietResult.stdout, 'basic\n', 'only env value appears on stdout when quiet defaults to true')

// dotenv/config shows log output when quiet is explicitly false
const verboseResult = spawnResult(
  [
    '-r',
    './config',
    '-e',
    'console.log(process.env.BASIC)',
    'dotenv_config_path=./tests/.env',
    'dotenv_config_quiet=false'
  ]
)
t.match(verboseResult.stdout, /injecting env/, 'shows log message on stdout when quiet is false')
t.match(verboseResult.stdout, /basic/, 'still outputs env value when quiet is false')

// dotenv/config supports DOTENV_CONFIG_QUIET env var
const quietEnvResult = spawnResult(
  [
    '-r',
    './config',
    '-e',
    'console.log(process.env.BASIC)'
  ],
  {
    env: {
      DOTENV_CONFIG_PATH: './tests/.env',
      DOTENV_CONFIG_QUIET: 'true'
    }
  }
)
t.equal(quietEnvResult.stdout, 'basic\n', 'suppresses log when DOTENV_CONFIG_QUIET env var is true')
