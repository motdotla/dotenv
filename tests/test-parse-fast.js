const fs = require('fs')
const t = require('tap')

const dotenv = require('../lib/main')

function assertSameParse (ct, src, label) {
  const classic = dotenv.parse(src)
  const fast = dotenv.parse(src, { fast: true })
  ct.same(fast, classic, label || 'fast parse matches classic parse')
}

t.test('fast parse matches classic parse for tests/.env', ct => {
  const src = fs.readFileSync('tests/.env', { encoding: 'utf8' })
  assertSameParse(ct, src)
  ct.end()
})

t.test('fast parse matches classic parse for multiline fixture', ct => {
  const src = fs.readFileSync('tests/.env.multiline', { encoding: 'utf8' })
  assertSameParse(ct, src)
  ct.end()
})

t.test('fast parse matches classic parse for edge cases', ct => {
  const cases = [
    'BASIC=basic',
    'export KEY=value',
    'KEY: value',
    'EMPTY=',
    "SINGLE='single'",
    'DOUBLE="double"',
    'BACKTICK=`backtick`',
    'DOUBLE="line one\\nline two"',
    'INLINE=value # comment',
    'HASH="value#notcomment"',
    'EQUALS==value',
    '# comment only\n',
    '',
    'KEY=val\r\nOTHER=ok\r',
    'MULTI="one\ntwo"',
    'ESCAPED="say \\"hi\\""'
  ]

  for (const src of cases) {
    assertSameParse(ct, src, JSON.stringify(src))
  }
  ct.end()
})

t.test('fast parse matches classic parse for a leading UTF-8 BOM', ct => {
  const cases = [
    '\uFEFFBASIC=basic',
    '\uFEFFBASIC=basic\nSECOND=two\n',
    '\uFEFFexport BASIC=basic\n',
    '\uFEFF# comment first\nBASIC=basic\n',
    '\uFEFF',
    '\n\uFEFFBASIC=basic\n',
    'FIRST=one\n\uFEFFSECOND=two\n'
  ]

  for (const src of cases) {
    assertSameParse(ct, src, JSON.stringify(src))
  }

  // pin the behaviour, so the two parsers can't agree by both being wrong
  ct.same(dotenv.parse('\uFEFFBASIC=basic', { fast: true }), { BASIC: 'basic' })
  ct.end()
})

t.test('fast parse matches classic parse for an escaped backslash before the closing quote', ct => {
  const cases = [
    'KEY="\\\\"',
    'KEY="\\\\"\nNEXT=ok\n',
    "KEY='\\\\'\nNEXT=ok\n",
    'KEY=`\\\\`\nNEXT=ok\n',
    'WINDIR="C:\\\\Users\\\\me\\\\"\nAPI_KEY=secret\nPORT=3000\n',
    'KEY="a\\\\b"\nNEXT=ok\n',
    'KEY="\\\\\\\\"\nNEXT=ok\n',
    'A="\\\\"\nB=plain\nC="quoted"\nD=last\n'
  ]

  for (const src of cases) {
    assertSameParse(ct, src, JSON.stringify(src))
  }

  // pin the behaviour, so the two parsers can't agree by both being wrong.
  // dotenv does not unescape \\, so the value keeps both backslashes — the point
  // is that the value ends at its own closing quote and the later keys survive.
  ct.same(dotenv.parse('A="\\\\"\nB=plain\nC="quoted"\nD=last\n', { fast: true }), {
    A: '\\\\',
    B: 'plain',
    C: 'quoted',
    D: 'last'
  })
  ct.end()
})

t.test('config({ fast: true }) reads a .env written with a BOM', ct => {
  const processEnv = {}
  const result = dotenv.config({
    path: 'tests/.env.bom',
    quiet: true,
    fast: true,
    processEnv
  })

  ct.equal(processEnv.BASIC, 'basic')
  ct.equal(result.parsed.BASIC, 'basic')
  ct.end()
})

t.test('config({ fast: true }) loads with fast parser', ct => {
  const processEnv = {}
  const result = dotenv.config({
    path: 'tests/.env',
    quiet: true,
    fast: true,
    processEnv
  })

  ct.equal(processEnv.BASIC, 'basic')
  ct.equal(result.parsed.BASIC, 'basic')
  ct.end()
})
