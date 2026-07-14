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

t.plan(6)

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

// dotenv/config preserves existing values when env override option is false
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
        BASIC: 'existing',
        DOTENV_CONFIG_PATH: './tests/.env',
        DOTENV_CONFIG_QUIET: 'true',
        DOTENV_CONFIG_OVERRIDE: 'false'
      }
    }
  ),
  'existing\n'
)

// dotenv/config preserves existing values when CLI override option is false
t.equal(
  spawn(
    [
      '-r',
      './config',
      '-e',
      'console.log(process.env.BASIC)',
      'dotenv_config_path=./tests/.env',
      'dotenv_config_quiet=true',
      'dotenv_config_override=false'
    ],
    {
      env: {
        BASIC: 'existing'
      }
    }
  ),
  'existing\n'
)

// dotenv/config still overwrites existing values when env override option is true
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
        BASIC: 'existing',
        DOTENV_CONFIG_PATH: './tests/.env',
        DOTENV_CONFIG_QUIET: 'true',
        DOTENV_CONFIG_OVERRIDE: 'true'
      }
    }
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
