const cp = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const t = require('tap')

function spawn (args, options = {}) {
  return cp.spawnSync(
    process.argv[0],
    [path.resolve(__dirname, '../cli.js')].concat(args),
    Object.assign(
      {},
      {
        cwd: path.resolve(__dirname, '..'),
        timeout: 5000,
        encoding: 'utf8',
        env: Object.assign({}, process.env)
      },
      options
    )
  )
}

function removeDir (dir) {
  if (fs.rmSync) {
    fs.rmSync(dir, { recursive: true, force: true })
  } else {
    fs.rmdirSync(dir, { recursive: true })
  }
}

t.test('dotenv run loads .env by default', ct => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenv-run-'))
  fs.writeFileSync(path.join(cwd, '.env'), 'BASIC=basic\n')

  const result = spawn([
    'run',
    '--',
    process.argv[0],
    '-e',
    'console.log(process.env.BASIC)'
  ], {
    cwd
  })

  removeDir(cwd)

  ct.equal(result.status, 0)
  ct.equal(result.stdout, 'basic\n')
  ct.equal(result.stderr, '◇ injected env (1) from .env\n')
  ct.end()
})

t.test('dotenv run continues when default .env is missing', ct => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenv-run-'))

  const result = spawn([
    'run',
    '--',
    process.argv[0],
    '-e',
    'console.log("ok")'
  ], {
    cwd
  })

  removeDir(cwd)

  ct.equal(result.status, 0)
  ct.equal(result.stdout, 'ok\n')
  ct.equal(result.stderr, '◇ injected env (0)\n')
  ct.end()
})

t.test('dotenv run supports -f path', ct => {
  const result = spawn([
    'run',
    '-f',
    './tests/.env.local',
    '--',
    process.argv[0],
    '-e',
    'console.log(process.env.BASIC)'
  ])

  ct.equal(result.status, 0)
  ct.equal(result.stdout, 'local_basic\n')
  ct.equal(result.stderr, '◇ injected env (2) from ./tests/.env.local\n')
  ct.end()
})

t.test('dotenv run supports -f=path', ct => {
  const result = spawn([
    'run',
    '-f=./tests/.env.local',
    '--',
    process.argv[0],
    '-e',
    'console.log(process.env.BASIC)'
  ])

  ct.equal(result.status, 0)
  ct.equal(result.stdout, 'local_basic\n')
  ct.equal(result.stderr, '◇ injected env (2) from ./tests/.env.local\n')
  ct.end()
})

t.test('dotenv run supports multiple -f paths without override', ct => {
  const result = spawn([
    'run',
    '-f',
    './tests/.env.local',
    '-f',
    './tests/.env',
    '--',
    process.argv[0],
    '-e',
    'console.log(process.env.BASIC)'
  ])

  ct.equal(result.status, 0)
  ct.equal(result.stdout, 'local_basic\n')
  ct.equal(result.stderr, '◇ injected env (41) from ./tests/.env.local, ./tests/.env\n')
  ct.end()
})

t.test('dotenv run does not override existing environment variables', ct => {
  const result = spawn(
    [
      'run',
      '-f',
      './tests/.env',
      '--',
      process.argv[0],
      '-e',
      'console.log(process.env.BASIC)'
    ],
    {
      env: Object.assign({}, process.env, { BASIC: 'existing' })
    }
  )

  ct.equal(result.status, 0)
  ct.equal(result.stdout, 'existing\n')
  ct.equal(result.stderr, '◇ injected env (39) from ./tests/.env\n')
  ct.end()
})

t.test('dotenv run does not expand variables', ct => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenv-run-'))
  fs.writeFileSync(path.join(cwd, '.env'), 'BASIC=basic\nEXPANDED=$BASIC\n')

  const result = spawn([
    'run',
    '--',
    process.argv[0],
    '-e',
    'console.log(process.env.EXPANDED)'
  ], {
    cwd
  })

  removeDir(cwd)

  ct.equal(result.status, 0)
  ct.equal(result.stdout, '$BASIC\n')
  ct.equal(result.stderr, '◇ injected env (2) from .env\n')
  ct.end()
})

t.test('dotenv run exits with child status', ct => {
  const result = spawn([
    'run',
    '--',
    process.argv[0],
    '-e',
    'process.exit(7)'
  ])

  ct.equal(result.status, 7)
  ct.end()
})

t.test('dotenv run supports --quiet', ct => {
  const result = spawn([
    'run',
    '--quiet',
    '-f',
    './tests/.env.local',
    '--',
    process.argv[0],
    '-e',
    'console.log(process.env.BASIC)'
  ])

  ct.equal(result.status, 0)
  ct.equal(result.stdout, 'local_basic\n')
  ct.equal(result.stderr, '')
  ct.end()
})

t.test('dotenv run requires -- before command', ct => {
  const result = spawn([
    'run',
    process.argv[0],
    '-e',
    'console.log("nope")'
  ])

  ct.equal(result.status, 1)
  ct.match(result.stdout, /Usage: dotenv run/)
  ct.equal(result.stderr, 'dotenv: unknown option: ' + process.argv[0] + '\n')
  ct.end()
})

t.test('dotenv run requires a command', ct => {
  const result = spawn(['run', '--'])

  ct.equal(result.status, 1)
  ct.match(result.stdout, /Usage: dotenv run/)
  ct.equal(result.stderr, '')
  ct.end()
})

t.test('dotenv run exits when selected env file is missing', ct => {
  const result = spawn([
    'run',
    '-f',
    './tests/.env.missing',
    '--',
    process.argv[0],
    '-e',
    'console.log(process.env.BASIC)'
  ])

  ct.equal(result.status, 1)
  ct.equal(result.stdout, '')
  ct.match(result.stderr, /ENOENT/)
  ct.end()
})
