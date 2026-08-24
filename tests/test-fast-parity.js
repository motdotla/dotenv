'use strict'
// Restore the parity tests (they were removed from the working tree earlier).
const t = require('tap')
const dotenv = require('../lib/main')

t.test('fast parser: blank line before quoted multiline value', (t) => {
  const src = 'A=\n\n"hello\nworld"'
  t.same(dotenv.parse(src), { A: 'hello\nworld' })
  t.same(dotenv.parse(src, { fast: true }), { A: 'hello\nworld' }, 'fast must match default')
  t.end()
})

t.test('fast parser: whitespace variants before key', (t) => {
  for (const ws of ['\f', '\v', ' ']) {
    const src = `${ws}A=1`
    t.same(dotenv.parse(src), { A: '1' })
    t.same(dotenv.parse(src, { fast: true }), { A: '1' }, `fast drops key after ${JSON.stringify(ws)}`)
  }
  t.end()
})

t.test('fast parser: trailing junk after closing quote', (t) => {
  const src = 'TOKEN="abc" oops'
  t.same(dotenv.parse(src), { TOKEN: '"abc" oops' })
  t.same(dotenv.parse(src, { fast: true }), { TOKEN: '"abc" oops' }, 'fast must match default')
  t.end()
})
