/* @flow */

const fs = require('fs')

const sinon = require('sinon')
const t = require('tap')

const dotenv = require('../lib/main')

t.plan(2)

t.test('without prefix', ct => {
  ct.plan(29)

  const parsed = dotenv.parse(fs.readFileSync('tests/.env', { encoding: 'utf8' }))

  ct.type(parsed, Object, 'should return an object')

  ct.equal(parsed.BASIC, 'basic', 'sets basic environment variable')

  ct.equal(parsed.AFTER_LINE, 'after_line', 'reads after a skipped line')

  ct.equal(parsed.EMPTY, '', 'defaults empty values to empty string')

  ct.equal(parsed.SINGLE_QUOTES, 'single_quotes', 'escapes single quoted values')

  ct.equal(parsed.SINGLE_QUOTES_SPACED, '    single quotes    ', 'respects surrounding spaces in single quotes')

  ct.equal(parsed.DOUBLE_QUOTES, 'double_quotes', 'escapes double quoted values')

  ct.equal(parsed.DOUBLE_QUOTES_SPACED, '    double quotes    ', 'respects surrounding spaces in double quotes')

  ct.equal(parsed.EXPAND_NEWLINES, 'expand\nnew\nlines', 'expands newlines but only if double quoted')

  ct.equal(parsed.DONT_EXPAND_UNQUOTED, 'dontexpand\\nnewlines', 'expands newlines but only if double quoted')

  ct.equal(parsed.DONT_EXPAND_SQUOTED, 'dontexpand\\nnewlines', 'expands newlines but only if double quoted')

  ct.notOk(parsed.COMMENTS, 'ignores commented lines')

  ct.equal(parsed.EQUAL_SIGNS, 'equals==', 'respects equals signs in values')

  ct.equal(parsed.RETAIN_INNER_QUOTES, '{"foo": "bar"}', 'retains inner quotes')

  ct.equal(parsed.RETAIN_LEADING_DQUOTE, '"retained', 'retains leading double quote')

  ct.equal(parsed.RETAIN_LEADING_SQUOTE, "'retained", 'retains leading single quote')

  ct.equal(parsed.RETAIN_TRAILING_DQUOTE, 'retained"', 'reatins trailing double quote')

  ct.equal(parsed.RETAIN_TRAILING_SQUOTE, "retained'", 'retains trailing single quote')

  ct.equal(parsed.RETAIN_INNER_QUOTES_AS_STRING, '{"foo": "bar"}', 'retains inner quotes')

  ct.equal(parsed.TRIM_SPACE_FROM_UNQUOTED, 'some spaced out string', 'retains spaces in string')

  ct.equal(parsed.USERNAME, 'therealnerdybeast@example.tld', 'parses email addresses completely')

  ct.equal(parsed.SPACED_KEY, 'parsed', 'parses keys and values surrounded by spaces')

  ct.equal(parsed.CLIENT_APP_KEY, '12345key', 'parses keys and values')

  ct.equal(parsed.CLIENT_APP__KEY, '12345key', 'parses keys and values with double _')

  ct.equal(parsed.CLIENT_APPKEY, '12345key', 'parses keys and values')

  ct.equal(parsed['CLIENT_APP_.KEY'], '12345key', 'parses keys and values with dot (.)')

  ct.equal(parsed.CLIENT_KEY, '12345key', 'parses keys and values')

  const payload = dotenv.parse(Buffer.from('BUFFER=true'))
  ct.equal(payload.BUFFER, 'true', 'should parse a buffer into an object')

  // test debug path
  const logStub = sinon.stub(console, 'log')
  dotenv.parse(Buffer.from('what is this'), { debug: true })
  ct.ok(logStub.called)
  logStub.restore()
})

t.test('with prefix', ct => {
  ct.plan(10)

  const parsed = dotenv.parse(fs.readFileSync('tests/.env', { encoding: 'utf8' }), { prefix: 'CLIENT_APP' })
  console.log(parsed)
  ct.type(parsed, Object, 'should return an object')

  ct.notOk(parsed.BASIC, 'basic', 'ignore keys not matched with prefix')

  ct.equal(parsed.CLIENT_APP_KEY, '12345key', 'parses key and value')

  ct.equal(parsed.CLIENT_APP__KEY, '12345key', 'parses key and value with multiple or atleast 1 _')

  ct.notOk(parsed.CLIENT_APPKEY, '12345key', 'ignore key without _ after the prefix')

  ct.notOk(parsed['CLIENT_APP_.KEY'], '12345key', 'ignore keys with dot (.) and other special characters, would only accept words')

  ct.notOk(parsed.CLIENT_KEY, '12345key', 'ignore keys not matched with prefix')

  ct.equal(parsed.CLIENT_APP_SPACED_KEY, '12345key', 'parses keys and values even with spaces at first of the key')

  const payload = dotenv.parse(Buffer.from('BUFFER=true'))
  ct.equal(payload.BUFFER, 'true', 'should parse a buffer into an object')

  // test debug path
  const logStub = sinon.stub(console, 'log')
  dotenv.parse(Buffer.from('what is this'), { debug: true })
  ct.ok(logStub.called)
  logStub.restore()
})
