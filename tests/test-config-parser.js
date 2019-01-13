/* @flow */

const fs = require('fs')

const sinon = require('sinon')
const t = require('tap')

const dotenv = require('../lib/main')

t.plan(1)

t.test('takes option for parser', ct => {
  ct.plan(1)

  const testPath = 'tests/.env.json'
  const customParser = function (src, options) {
    return JSON.parse(src)
  }

  sinon.stub(fs, 'readFileSync').returns('{"test": "foo"}')
  const res = dotenv.config({ path: testPath, parser: customParser })

  ct.equal(res.parsed.test, 'foo')
})
