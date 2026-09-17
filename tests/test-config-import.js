const cp = require('child_process')
const path = require('path')
const t = require('tap')

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

t.test("import 'dotenv/config' loads env before application code", ct => {
  const result = cp.spawnSync(process.execPath, [
    '--input-type=module',
    '--eval',
    "import 'dotenv/config'; console.log(process.env.BASIC)"
  ], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    env: {
      ...process.env,
      DOTENV_CONFIG_PATH: 'tests/.env',
      DOTENV_CONFIG_QUIET: 'true'
    }
  })

  ct.equal(result.status, 0)
  ct.equal(result.stdout, 'basic\n')
  ct.equal(result.stderr, '')
  ct.end()
})
