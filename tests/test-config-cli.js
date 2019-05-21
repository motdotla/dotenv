/* @flow */

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

t.plan(9)

// dotenv/config enables preloading
t.equal(
  spawn([
    '-r',
    '../config',
    '-e',
    'console.log(process.env.BASIC)',
    'dotenv_config_encoding=utf8',
    'dotenv_config_path=./tests/.env'
  ]),
  'basic\n'
)

// dotenv/config supports configuration via environment variables
t.equal(
  spawn(['-r', '../config', '-e', 'console.log(process.env.BASIC)'], {
    env: {
      DOTENV_CONFIG_PATH: './tests/.env'
    }
  }),
  'basic\n'
)

// dotenv/config takes CLI configuration over environment variables
t.equal(
  spawn(
    [
      '-r',
      '../config',
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

// dotenv/config enables preloading with prefix option
// should return value since keys were matched
t.equal(
  spawn([
    '-r',
    '../config',
    '-e',
    'console.log(process.env.CLIENT_APP_KEY)',
    'dotenv_config_encoding=utf8',
    'dotenv_config_path=./tests/.env',
    'dotenv_config_prefix=CLIENT_APP'
  ]),
  '12345key\n'
)
// should return undefined since keys were not matched
t.equal(
  spawn([
    '-r',
    '../config',
    '-e',
    'console.log(process.env.BASIC)',
    'dotenv_config_encoding=utf8',
    'dotenv_config_path=./tests/.env',
    'dotenv_config_prefix=CLIENT_APP'
  ]),
  'undefined\n'
)

// dotenv/config supports configuration via environment variables with prefix option
// should return value since keys were matched
t.equal(
  spawn(['-r', '../config', '-e', 'console.log(process.env.CLIENT_APP_KEY)'], {
    env: {
      DOTENV_CONFIG_PATH: './tests/.env',
      DOTENV_CONFIG_PREFIX: 'CLIENT_APP'
    }
  }),
  '12345key\n'
)
// should return undefined since keys were not matched
t.equal(
  spawn(['-r', '../config', '-e', 'console.log(process.env.BASIC)'], {
    env: {
      DOTENV_CONFIG_PATH: './tests/.env',
      DOTENV_CONFIG_PREFIX: 'CLIENT_APP'
    }
  }),
  'undefined\n'
)

// dotenv/config takes CLI configuration over environment variables with prefix option
// should return value since keys were matched
t.equal(
  spawn(
    [
      '-r',
      '../config',
      '-e',
      'console.log(process.env.CLIENT_APP_KEY)',
      'dotenv_config_path=./tests/.env',
      'dotenv_config_prefix=CLIENT_APP'
    ],
    {
      env: {
        DOTENV_CONFIG_PATH: '/tmp/dne/path/.env.should.break'
      }
    }
  ),
  '12345key\n'
)
// should return undefined since keys were not matched
t.equal(
  spawn(
    [
      '-r',
      '../config',
      '-e',
      'console.log(process.env.BASIC)',
      'dotenv_config_path=./tests/.env',
      'dotenv_config_prefix=CLIENT_APP'
    ],
    {
      env: {
        DOTENV_CONFIG_PATH: '/tmp/dne/path/.env.should.break'
      }
    }
  ),
  'undefined\n'
)
