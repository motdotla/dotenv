const fs = require('fs')
const t = require('tap')

const dotenv = require('../lib/main')

const parsed = dotenv.parse(fs.readFileSync('tests/.env', { encoding: 'utf8' }))

t.type(parsed, Object, 'should return an object')

t.equal(parsed.BASIC, 'basic', 'sets basic environment variable')

t.equal(parsed.AFTER_LINE, 'after_line', 'reads after a skipped line')

t.equal(parsed.EMPTY, '', 'defaults empty values to empty string')

t.equal(parsed.EMPTY_SINGLE_QUOTES, '', 'defaults empty values to empty string')

t.equal(parsed.EMPTY_DOUBLE_QUOTES, '', 'defaults empty values to empty string')

t.equal(parsed.EMPTY_BACKTICKS, '', 'defaults empty values to empty string')

t.equal(parsed.SINGLE_QUOTES, 'single_quotes', 'escapes single quoted values')

t.equal(parsed.SINGLE_QUOTES_SPACED, '    single quotes    ', 'respects surrounding spaces in single quotes')

t.equal(parsed.DOUBLE_QUOTES, 'double_quotes', 'escapes double quoted values')

t.equal(parsed.DOUBLE_QUOTES_SPACED, '    double quotes    ', 'respects surrounding spaces in double quotes')

t.equal(parsed.DOUBLE_QUOTES_INSIDE_SINGLE, 'double "quotes" work inside single quotes', 'respects double quotes inside single quotes')

t.equal(parsed.DOUBLE_QUOTES_WITH_NO_SPACE_BRACKET, '{ port: $MONGOLAB_PORT}', 'respects spacing for badly formed brackets')

t.equal(parsed.SINGLE_QUOTES_INSIDE_DOUBLE, "single 'quotes' work inside double quotes", 'respects single quotes inside double quotes')

t.equal(parsed.BACKTICKS_INSIDE_SINGLE, '`backticks` work inside single quotes', 'respects backticks inside single quotes')

t.equal(parsed.BACKTICKS_INSIDE_DOUBLE, '`backticks` work inside double quotes', 'respects backticks inside double quotes')

t.equal(parsed.BACKTICKS, 'backticks')

t.equal(parsed.BACKTICKS_SPACED, '    backticks    ')

t.equal(parsed.DOUBLE_QUOTES_INSIDE_BACKTICKS, 'double "quotes" work inside backticks', 'respects double quotes inside backticks')

t.equal(parsed.SINGLE_QUOTES_INSIDE_BACKTICKS, "single 'quotes' work inside backticks", 'respects single quotes inside backticks')

t.equal(parsed.DOUBLE_AND_SINGLE_QUOTES_INSIDE_BACKTICKS, "double \"quotes\" and single 'quotes' work inside backticks", 'respects single quotes inside backticks')

t.equal(parsed.EXPAND_NEWLINES, 'expand\nnew\nlines', 'expands newlines but only if double quoted')

t.equal(parsed.DONT_EXPAND_UNQUOTED, 'dontexpand\\nnewlines', 'expands newlines but only if double quoted')

t.equal(parsed.DONT_EXPAND_SQUOTED, 'dontexpand\\nnewlines', 'expands newlines but only if double quoted')

t.notOk(parsed.COMMENTS, 'ignores commented lines')

t.equal(parsed.INLINE_COMMENTS, 'inline comments', 'ignores inline comments')

t.equal(parsed.INLINE_COMMENTS_SINGLE_QUOTES, 'inline comments outside of #singlequotes', 'ignores inline comments and respects # character inside of single quotes')

t.equal(parsed.INLINE_COMMENTS_DOUBLE_QUOTES, 'inline comments outside of #doublequotes', 'ignores inline comments and respects # character inside of double quotes')

t.equal(parsed.INLINE_COMMENTS_BACKTICKS, 'inline comments outside of #backticks', 'ignores inline comments and respects # character inside of backticks')

t.equal(parsed.INLINE_COMMENTS_SPACE, 'inline comments start with a', 'treats # character as start of comment')

t.equal(parsed.EQUAL_SIGNS, 'equals==', 'respects equals signs in values')

t.equal(parsed.RETAIN_INNER_QUOTES, '{"foo": "bar"}', 'retains inner quotes')

t.equal(parsed.RETAIN_INNER_QUOTES_AS_STRING, '{"foo": "bar"}', 'retains inner quotes')

t.equal(parsed.RETAIN_INNER_QUOTES_AS_BACKTICKS, '{"foo": "bar\'s"}', 'retains inner quotes')

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
