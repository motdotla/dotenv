'use strict'

const t = require('tap')
const dotenv = require('../lib/main')

t.test('fast parser: blank line before quoted multiline value', (t) => {
  const src = 'A=\n\n"hello\nworld"'
  t.same(dotenv.parse(src), { A: 'hello\nworld' })
  t.same(dotenv.parse(src, { fast: true }), { A: 'hello\nworld' }, 'fast must match default')

  const singleSrc = "A=\n'hello\nworld'"
  t.same(dotenv.parse(singleSrc), { A: 'hello\nworld' })
  t.same(dotenv.parse(singleSrc, { fast: true }), { A: 'hello\nworld' }, 'fast must match default for single quotes')

  const backtickSrc = 'A=\n\n`hello\nworld`'
  t.same(dotenv.parse(backtickSrc), { A: 'hello\nworld' })
  t.same(dotenv.parse(backtickSrc, { fast: true }), { A: 'hello\nworld' }, 'fast must match default for backticks')

  const junkSrc = 'A=\n\n"x" junk'
  t.same(dotenv.parse(junkSrc), { A: '' })
  t.same(dotenv.parse(junkSrc, { fast: true }), { A: '' }, 'fast must match default when trailing junk is present after newline quoted value')

  t.end()
})

t.test('fast parser: whitespace variants before key', (t) => {
  for (const ws of ['\f', '\v', '\u00A0', ' ']) {
    const src = `${ws}A=1`
    t.same(dotenv.parse(src), { A: '1' })
    t.same(dotenv.parse(src, { fast: true }), { A: '1' }, `fast handles key after ${JSON.stringify(ws)}`)
  }
  t.end()
})

t.test('fast parser: trailing junk after closing quote', (t) => {
  const src = 'TOKEN="abc" oops'
  t.same(dotenv.parse(src), { TOKEN: '"abc" oops' })
  t.same(dotenv.parse(src, { fast: true }), { TOKEN: '"abc" oops' }, 'fast must match default')
  t.end()
})
