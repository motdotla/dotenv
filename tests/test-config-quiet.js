const cp = require('child_process')
const path = require('path')
const t = require('tap')

// Isolate startup options and loaded values from the test runner's environment.
const cleanEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => {
  return !key.toUpperCase().startsWith('DOTENV_')
}))
const entry = path.resolve(__dirname, '../dist/index.cjs')
const preload = path.resolve(__dirname, '../dist/config.cjs')
const program = 'console.log(process.env.DOTENV_QUIET)'
const modes = {
  config: ['-e', `require(${JSON.stringify(entry)}).config(); ${program}`],
  preload: ['-r', preload, '-e', program]
}

// Regression: https://github.com/motdotla/dotenv/issues/1057
const cases = [
  { name: 'true inside .env suppresses the first startup message', file: 'DOTENV_QUIET=true\n', value: 'true', quiet: true },
  { name: '1 inside .env suppresses the first startup message', file: 'DOTENV_QUIET=1\n', value: '1', quiet: true },
  { name: 'true in the shell suppresses the startup message', file: '', env: { DOTENV_QUIET: 'true' }, value: 'true', quiet: true },
  { name: 'false inside .env keeps the startup message', file: 'DOTENV_QUIET=false\n', value: 'false', quiet: false },
  { name: 'no quiet setting keeps the startup message', file: '', value: 'undefined', quiet: false }
]

for (const [mode, args] of Object.entries(modes)) {
  for (const testCase of cases) {
    t.test(`${mode}: ${testCase.name}`, ct => {
      const cwd = ct.testdir({ '.env': testCase.file })
      const result = cp.spawnSync(process.execPath, args, {
        cwd,
        encoding: 'utf8',
        env: { ...cleanEnv, ...testCase.env }
      })

      ct.equal(result.status, 0, 'process exits successfully')
      ct.equal(result.stdout, `${testCase.value}\n`, 'application sees the loaded setting without startup output')
      if (testCase.quiet) {
        ct.equal(result.stderr, '', 'first load emits no startup message')
      } else {
        ct.match(result.stderr, /injected env \(\d+\) from \.env/, 'startup logging remains enabled')
      }
      ct.end()
    })
  }
}
