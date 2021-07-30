/* @flow */

const fs = require('fs')

const sinon = require('sinon')
const t = require('tap')

const dotenv = require('../lib/main')

const parsed = dotenv.parse(fs.readFileSync('tests/.env', { encoding: 'utf8' }))

t.plan(28)

t.type(parsed, Object, 'should return an object')

t.equal(parsed.BASIC, 'basic', 'sets basic environment variable')

t.equal(parsed.AFTER_LINE, 'after_line', 'reads after a skipped line')

t.equal(parsed.EMPTY, '', 'defaults empty values to empty string')

t.equal(parsed.SINGLE_QUOTES, 'single_quotes', 'escapes single quoted values')

t.equal(parsed.SINGLE_QUOTES_SPACED, '    single quotes    ', 'respects surrounding spaces in single quotes')

t.equal(parsed.DOUBLE_QUOTES, 'double_quotes', 'escapes double quoted values')

t.equal(parsed.DOUBLE_QUOTES_SPACED, '    double quotes    ', 'respects surrounding spaces in double quotes')

t.equal(parsed.EXPAND_NEWLINES, 'expand\nnew\nlines', 'expands newlines but only if double quoted')

t.equal(parsed.DONT_EXPAND_UNQUOTED, 'dontexpand\\nnewlines', 'expands newlines but only if double quoted')

t.equal(parsed.DONT_EXPAND_SQUOTED, 'dontexpand\\nnewlines', 'expands newlines but only if double quoted')

t.notOk(parsed.COMMENTS, 'ignores commented lines')

t.equal(parsed.EQUAL_SIGNS, 'equals==', 'respects equals signs in values')

t.equal(parsed.RETAIN_INNER_QUOTES, '{"foo": "bar"}', 'retains inner quotes')

t.equal(parsed.RETAIN_LEADING_DQUOTE, '"retained', 'retains leading double quote')

t.equal(parsed.RETAIN_LEADING_SQUOTE, "'retained", 'retains leading single quote')

t.equal(parsed.RETAIN_TRAILING_DQUOTE, 'retained"', 'reatins trailing double quote')

t.equal(parsed.RETAIN_TRAILING_SQUOTE, "retained'", 'retains trailing single quote')

t.equal(parsed.RETAIN_INNER_QUOTES_AS_STRING, '{"foo": "bar"}', 'retains inner quotes')

t.equal(parsed.TRIM_SPACE_FROM_UNQUOTED, 'some spaced out string', 'retains spaces in string')

t.equal(parsed.USERNAME, 'therealnerdybeast@example.tld', 'parses email addresses completely')

t.equal(parsed.SPACED_KEY, 'parsed', 'parses keys and values surrounded by spaces')

const payload = dotenv.parse(Buffer.from('BUFFER=true'))
t.equal(payload.BUFFER, 'true', 'should parse a buffer into an object')

const expectedPayload = { SERVER: 'localhost', PASSWORD: 'password', DB: 'tests' }

const RPayload = dotenv.parse(Buffer.from('SERVER=localhost\rPASSWORD=password\rDB=tests\r'))
t.same(RPayload, expectedPayload, 'can parse (\\r) line endings')

const NPayload = dotenv.parse(Buffer.from('SERVER=localhost\nPASSWORD=password\nDB=tests\n'))
t.same(NPayload, expectedPayload, 'can parse (\\n) line endings')

const RNPayload = dotenv.parse(Buffer.from('SERVER=localhost\r\nPASSWORD=password\r\nDB=tests\r\n'))
t.same(RNPayload, expectedPayload, 'can parse (\\r\\n) line endings')

// test debug path
let logStub = sinon.stub(console, 'log')
dotenv.parse(Buffer.from('what is this'), { debug: true })
t.ok(logStub.calledOnce)
logStub.restore()

// test that debug in windows (\r\n lines) logs just once per line
logStub = sinon.stub(console, 'log')
dotenv.parse(Buffer.from('HEY=there\r\n'), { debug: true })
t.ok(logStub.calledOnce)
logStub.restore()
