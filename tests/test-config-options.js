const cp = require('child_process')
const path = require('path')
const t = require('tap')
const { optionsFromEnv } = require('../lib/config-options')

const names = ['ENCODING', 'PATH', 'QUIET', 'DEBUG', 'OVERRIDE', 'FAST']
const cleanEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => {
  return !names.some(name => key === `DOTENV_${name}` || key === `DOTENV_CONFIG_${name}`)
}))

for (const name of names) {
  t.test(`${name} supports both names and preserves explicit false/empty values`, ct => {
    const current = `DOTENV_${name}`
    const legacy = `DOTENV_CONFIG_${name}`
    const saved = { ...process.env }
    ct.teardown(() => {
      for (const key of [current, legacy]) {
        if (saved[key] == null) delete process.env[key]
        else process.env[key] = saved[key]
      }
    })
    delete process.env[current]
    delete process.env[legacy]
    const key = name.toLowerCase()
    const isString = name === 'PATH' || name === 'ENCODING'
    ct.equal(optionsFromEnv()[key], undefined)
    process.env[legacy] = isString ? 'legacy' : 'true'
    ct.equal(optionsFromEnv()[key], isString ? 'legacy' : true)
    process.env[current] = isString ? 'current' : 'false'
    ct.equal(optionsFromEnv()[key], isString ? 'current' : false)
    process.env[current] = ''
    ct.equal(optionsFromEnv()[key], isString ? '' : false)
    delete process.env[legacy]
    process.env[current] = isString ? 'current' : 'true'
    ct.equal(optionsFromEnv()[key], isString ? 'current' : true)
    ct.end()
  })
}

const program = 'console.log(process.env.BASIC)'
const modes = {
  config: ['-e', `require('dotenv').config(); ${program}`],
  import: ['--input-type=module', '-e', `import 'dotenv/config'; ${program}`],
  cli: ['dist/index.cjs', 'run', '--', process.execPath, '-e', program]
}

for (const [mode, args] of Object.entries(modes)) {
  t.test(`${mode} honors aliases and their precedence in the built package`, ct => {
    for (const prefix of ['DOTENV_', 'DOTENV_CONFIG_']) {
      const env = { ...cleanEnv, BASIC: 'existing' }
      env[`${prefix}PATH`] = 'tests/.env.local'
      env[`${prefix}QUIET`] = 'true'
      env[`${prefix}OVERRIDE`] = 'true'
      // When both names are set, the shorter names must win.
      if (prefix === 'DOTENV_') {
        env.DOTENV_CONFIG_PATH = 'tests/.env'
        env.DOTENV_CONFIG_QUIET = 'false'
        env.DOTENV_CONFIG_OVERRIDE = 'false'
      }
      const result = cp.spawnSync(process.execPath, args, {
        cwd: path.resolve(__dirname, '..'), encoding: 'utf8', env
      })
      ct.equal(result.status, 0)
      ct.equal(result.stdout, 'local_basic\n')
      ct.equal(result.stderr, '')
    }
    ct.end()
  })
}

t.test('explicit config options and CLI flags override both environment names', ct => {
  const env = {
    ...cleanEnv,
    DOTENV_PATH: 'tests/.env.local',
    DOTENV_CONFIG_PATH: 'missing.env',
    DOTENV_QUIET: 'false',
    DOTENV_CONFIG_QUIET: 'false'
  }
  const commands = [
    ['-e', `require('dotenv').config({ path: 'tests/.env', quiet: true }); ${program}`],
    ['dist/index.cjs', 'run', '-f', 'tests/.env', '--quiet', '--', process.execPath, '-e', program]
  ]
  delete env.BASIC
  for (const args of commands) {
    const result = cp.spawnSync(process.execPath, args, {
      cwd: path.resolve(__dirname, '..'), encoding: 'utf8', env
    })
    ct.equal(result.status, 0)
    ct.equal(result.stdout, 'basic\n')
    ct.equal(result.stderr, '')
  }
  ct.end()
})
