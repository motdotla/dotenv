const cp = require('child_process')
const path = require('path')
const t = require('tap')

const cleanEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => {
  return !key.toUpperCase().startsWith('DOTENV_') && key !== 'BASIC'
}))

t.test('built package supports named, default, and namespace ESM imports', ct => {
  const result = cp.spawnSync(process.execPath, [
    '--input-type=module',
    '--eval',
    `
      import assert from 'assert'
      import dotenv, { config, configDotenv, parse, populate } from 'dotenv'
      import * as namespace from 'dotenv'
      import { createRequire } from 'module'

      const require = createRequire(import.meta.url)
      assert.strictEqual(dotenv, require('dotenv'))
      for (const [name, fn] of Object.entries({ config, configDotenv, parse, populate })) {
        assert.strictEqual(typeof fn, 'function')
        assert.strictEqual(fn, dotenv[name])
        assert.strictEqual(fn, namespace[name])
      }
      assert.deepStrictEqual(parse('HELLO=world'), { HELLO: 'world' })
      const processEnv = {}
      populate(processEnv, { HELLO: 'world' })
      assert.strictEqual(processEnv.HELLO, 'world')
      const result = config({ path: 'tests/.env', quiet: true, processEnv: {} })
      assert.strictEqual(result.parsed.BASIC, 'basic')
    `
  ], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8'
  })

  ct.equal(result.status, 0, result.stderr)
  ct.equal(result.stdout, '')
  ct.equal(result.stderr, '')
  ct.end()
})

// Regression: https://github.com/motdotla/dotenv/issues/1062
const program = 'console.log(process.env.BASIC)'
const modes = {
  import: ['--input-type=module', '-e', `import 'dotenv/config'; ${program}`],
  'import .js alias': ['--input-type=module', '-e', `import 'dotenv/config.js'; ${program}`],
  require: ['-e', `require('dotenv/config'); ${program}`],
  preload: ['-r', 'dotenv/config', '-e', program],
  source: ['-r', './config.js', '-e', program]
}

for (const [mode, args] of Object.entries(modes)) {
  t.test(`${mode} loads env quietly by default`, ct => {
    const result = cp.spawnSync(process.execPath, args, {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf8',
      env: {
        ...cleanEnv,
        DOTENV_CONFIG_PATH: 'tests/.env'
      }
    })

    ct.equal(result.status, 0)
    ct.equal(result.stdout, 'basic\n')
    ct.equal(result.stderr, '')
    ct.end()
  })
}
