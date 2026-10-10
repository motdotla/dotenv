const fs = require('fs')
const os = require('os')
const path = require('path')
const t = require('tap')
const dotenv = require('../lib/main')

const key = '__proto__'
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key)

for (const fast of [false, true]) {
  t.test(`parse retains a __proto__ string key (fast=${fast})`, ct => {
    const parsed = dotenv.parse('__proto__=first\nKEEP=yes\n__proto__=last', { fast })
    ct.ok(hasOwn(parsed, '__proto__'))
    ct.equal(parsed[key], 'last')
    ct.same(Object.keys(parsed), ['__proto__', 'KEEP'])
    ct.equal(Object.getPrototypeOf(parsed), Object.prototype)
    ct.end()
  })

  t.test(`config retains a __proto__ key in a custom target (fast=${fast})`, ct => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenv-key-'))
    ct.teardown(() => fs.rmSync(dir, { recursive: true, force: true }))
    const envPath = path.join(dir, '.env')
    fs.writeFileSync(envPath, '__proto__=value\nKEEP=yes')
    const processEnv = {}
    const result = dotenv.config({ path: envPath, processEnv, fast, quiet: true })
    ct.notOk(result.error)
    ct.ok(hasOwn(result.parsed, '__proto__'))
    ct.ok(hasOwn(processEnv, '__proto__'))
    ct.equal(processEnv[key], 'value')
    ct.equal(processEnv.KEEP, 'yes')
    ct.equal(Object.getPrototypeOf(processEnv), Object.prototype)
    ct.end()
  })
}

t.test('populate applies existing-key override rules to __proto__', ct => {
  const processEnv = {}
  const first = JSON.parse('{"__proto__":"first"}')
  const second = JSON.parse('{"__proto__":"second"}')
  const populated = dotenv.populate(processEnv, first)
  ct.ok(hasOwn(populated, '__proto__'))
  ct.equal(populated[key], 'first')
  ct.equal(processEnv[key], 'first')
  ct.same(dotenv.populate(processEnv, second), {})
  ct.equal(processEnv[key], 'first')
  const overwritten = dotenv.populate(processEnv, second, { override: true })
  ct.ok(hasOwn(overwritten, '__proto__'))
  ct.equal(overwritten[key], 'second')
  ct.equal(processEnv[key], 'second')
  ct.equal(Object.getPrototypeOf(processEnv), Object.prototype)
  ct.end()
})
