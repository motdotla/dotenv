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
  { name: 'false in the shell takes precedence over .env', file: 'DOTENV_QUIET=true\n', env: { DOTENV_QUIET: 'false' }, value: 'false', quiet: false },
  { name: 'legacy quiet inside .env suppresses the startup message', file: 'DOTENV_CONFIG_QUIET=true\n', value: 'undefined', quiet: true },
  { name: 'legacy false in the shell enables the startup message', file: '', env: { DOTENV_CONFIG_QUIET: 'false' }, value: 'undefined', quiet: false },
  { name: 'debug enables logging even with quiet', file: '', env: { DOTENV_DEBUG: 'true', DOTENV_QUIET: 'true' }, value: 'true', quiet: false, debug: true },
  { name: 'false inside .env respects the entry point default', file: 'DOTENV_QUIET=false\n', value: 'false', quiet: false, preloadQuiet: true },
  { name: 'no quiet setting uses the entry point default', file: '', value: 'undefined', quiet: false, preloadQuiet: true }
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
      if (testCase.debug) {
        ct.match(result.stdout, /no encoding is specified/, 'debug output remains enabled')
        ct.ok(result.stdout.endsWith(`${testCase.value}\n`), 'application sees the loaded setting')
      } else {
        ct.equal(result.stdout, `${testCase.value}\n`, 'application sees the loaded setting without startup output')
      }
      if (testCase.quiet || (mode === 'preload' && testCase.preloadQuiet)) {
        ct.equal(result.stderr, '', 'first load emits no startup message')
      } else {
        ct.match(result.stderr, /injected env \(\d+\) from \.env/, 'startup logging remains enabled')
      }
      ct.end()
    })
  }
}

for (const testCase of [
  { name: 'explicit false takes precedence over .env', options: '{ quiet: false }', quiet: false },
  { name: 'custom processEnv honors quiet from .env', options: '{ processEnv: {} }', quiet: true }
]) {
  t.test(testCase.name, ct => {
    const cwd = ct.testdir({ '.env': 'DOTENV_QUIET=true\n' })
    const result = cp.spawnSync(process.execPath, [
      '-e',
      `const result = require(${JSON.stringify(entry)}).config(${testCase.options}); console.log(result.parsed.DOTENV_QUIET)`
    ], { cwd, encoding: 'utf8', env: cleanEnv })

    ct.equal(result.status, 0, 'process exits successfully')
    ct.equal(result.stdout, 'true\n', 'file is parsed successfully')
    if (testCase.quiet) {
      ct.equal(result.stderr, '', 'first load emits no startup message')
    } else {
      ct.match(result.stderr, /injected env \(1\) from \.env/, 'explicit false keeps logging enabled')
    }
    ct.end()
  })
}
