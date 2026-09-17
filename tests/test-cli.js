const cp = require('child_process')
const path = require('path')
const t = require('tap')

function run (args, env = process.env) {
  return cp.spawnSync(process.execPath, ['dist/index.cjs', 'run', ...args], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    env
  })
}

for (const separator of [[], ['--']]) {
  t.test(`runs a command ${separator.length ? 'with' : 'without'} -- and forwards its options`, ct => {
    const args = ['--help', '-q', '--quiet', '--debug', '--override', '--fast', '-f', 'child.env', '--file=child1.env,child2.env', '--', 'tail']
    const script = 'console.log(JSON.stringify({ basic: process.env.BASIC, args: process.argv.slice(1) }))'
    const result = run([
      separator.length ? '--quiet' : '-q', '--override', '-f', 'tests/.env', ...separator,
      process.execPath, '-e', script, '--', ...args
    ])
    ct.equal(result.status, 0, result.stderr)
    ct.equal(result.stdout, JSON.stringify({ basic: 'basic', args }) + '\n')
    ct.equal(result.stderr, '')
    ct.end()
  })

  t.test(`preserves child exit code ${separator.length ? 'with' : 'without'} --`, ct => {
    const result = run(['--quiet', ...separator, process.execPath, '-e', 'process.exit(42)'])
    ct.equal(result.status, 42)
    ct.end()
  })
}

t.test('rejects unknown dotenv options before the command', ct => {
  const result = run(['--unknown', process.execPath, '-e', 'process.exit(42)'])
  ct.equal(result.status, 1)
  ct.match(result.stderr, /unknown option: --unknown/)
  ct.end()
})

t.test('requires a command and a value for -f', ct => {
  for (const args of [[], ['--'], ['--quiet'], ['-f'], ['-f', '--']]) {
    ct.equal(run(args).status, 1, JSON.stringify(args))
  }
  ct.end()
})

t.test('help before the command still shows dotenv help', ct => {
  const result = run(['--help'])
  ct.equal(result.status, 0)
  ct.match(result.stdout, /Usage: dotenv run/)
  ct.end()
})

const fileSelections = [
  ['-f', 'tests/.env.local,tests/.env'],
  ['--file', 'tests/.env.local,tests/.env'],
  ['-f=tests/.env.local,tests/.env'],
  ['--file=tests/.env.local,tests/.env'],
  ['-f', 'tests/.env.local', '--file', 'tests/.env'],
  ['--file=tests/.env.local', '-f=tests/.env'],
  ['--file', ' , tests/.env.local, , tests/.env, ']
]

for (const flags of fileSelections) {
  t.test(`loads files in order: ${flags.join(' ')}`, ct => {
    const env = { ...process.env, DOTENV_OVERRIDE: 'false', DOTENV_DEBUG: 'false' }
    delete env.BASIC
    for (const override of [false, true]) {
      const result = run([
        '-q', ...flags, ...(override ? ['--override'] : []),
        process.execPath, '-e', 'console.log(process.env.BASIC)'
      ], env)
      ct.equal(result.status, 0, result.stderr)
      ct.equal(result.stdout, (override ? 'basic' : 'local_basic') + '\n')
      ct.equal(result.stderr, '')
    }
    ct.end()
  })
}

t.test('file flags reject missing or empty lists', ct => {
  for (const flags of [['--file'], ['--file', '--'], ['--file='], ['-f='], ['-f', ', ,'], ['--file', '  ']]) {
    const result = run(flags)
    ct.equal(result.status, 1)
    ct.match(result.stderr, /requires a path/)
  }
  ct.end()
})
