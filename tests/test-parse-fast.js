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

// Regressions reported in https://github.com/motdotla/dotenv/issues/1043,
// including the unterminated quote and separate quoted segments follow-up.
// Pin the classic result next to each fast assertion so parity cannot pass
// simply because both parsers return the same incorrect result.
const parityRegressions = [
  {
    name: 'blank line before a quoted multiline value',
    src: 'A=\n\n"hello\nworld"',
    expected: { A: 'hello\nworld' }
  },
  {
    name: 'quoted value on the next line',
    src: "A=\n'b'",
    expected: { A: 'b' }
  },
  {
    name: 'form feed before a key',
    src: '\fA=1',
    expected: { A: '1' }
  },
  {
    name: 'vertical tab before a key',
    src: '\vA=1',
    expected: { A: '1' }
  },
  {
    name: 'non-breaking space before a key',
    src: '\u00A0A=1',
    expected: { A: '1' }
  },
  {
    name: 'trailing junk after a closing quote',
    src: 'TOKEN="abc" oops',
    expected: { TOKEN: '"abc" oops' }
  },
  {
    name: 'escaped newline in an unterminated double-quoted value',
    src: 'KEY="line one\\nline two',
    expected: { KEY: '"line one\nline two' }
  },
  {
    name: 'escaped carriage return in an unterminated double-quoted value',
    src: 'KEY="line one\\rline two',
    expected: { KEY: '"line one\rline two' }
  },
  {
    name: 'separate quoted segments on one line',
    src: 'KEY="a" "b"',
    expected: { KEY: 'a" "b' }
  }
]

for (const { name, src, expected } of parityRegressions) {
  t.test(`issue #1043: ${name}`, ct => {
    ct.same(dotenv.parse(src), expected, 'classic parser returns the expected value')
    ct.same(dotenv.parse(src, { fast: true }), expected, 'fast parser returns the same expected value')
    const surrounded = Buffer.from(`BEFORE=one\n${src}\nAFTER=two\n`)
    const expectedSurrounded = { BEFORE: 'one', ...expected, AFTER: 'two' }
    ct.same(dotenv.parse(surrounded), expectedSurrounded, 'classic parser preserves surrounding keys in a buffer')
    ct.same(dotenv.parse(surrounded, { fast: true }), expectedSurrounded, 'fast parser preserves surrounding keys in a buffer')
    ct.end()
  })
}

t.test('fast parse handles whitespace without consuming the next assignment', ct => {
  const cases = [
    { src: 'EMPTY=\nNEXT=ok', expected: { EMPTY: '', NEXT: 'ok' } },
    { src: 'INVALID\nNEXT=ok', expected: { NEXT: 'ok' } },
    { src: 'KEY\n=ok', expected: { KEY: 'ok' } },
    { src: 'export\u00A0KEY\f=\vvalue\u00A0', expected: { KEY: 'value' } },
    { src: 'KEY:\u00A0value', expected: { KEY: 'value' } },
    { src: 'KEY=\n\n`one\ntwo`\nNEXT=ok', expected: { KEY: 'one\ntwo', NEXT: 'ok' } },
    { src: 'KEY="abc" # comment\nNEXT=ok', expected: { KEY: 'abc', NEXT: 'ok' } },
    { src: 'KEY=\n"unterminated\nNEXT=ok', expected: { KEY: '', NEXT: 'ok' } }
  ]
  for (const { src, expected } of cases) {
    ct.same(dotenv.parse(src), expected, `classic: ${JSON.stringify(src)}`)
    ct.same(dotenv.parse(src, { fast: true }), expected, `fast: ${JSON.stringify(src)}`)
  }
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
