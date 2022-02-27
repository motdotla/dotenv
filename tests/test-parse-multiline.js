const fs = require('fs')
const t = require('tap')

const dotenv = require('../lib/main')

const parsed = dotenv.parse(fs.readFileSync('tests/.env-multiline', { encoding: 'utf8' }))

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

t.equal(parsed.RETAIN_INNER_QUOTES_AS_STRING, '{"foo": "bar"}', 'retains inner quotes')

t.equal(parsed.TRIM_SPACE_FROM_UNQUOTED, 'some spaced out string', 'retains spaces in string')

t.equal(parsed.USERNAME, 'therealnerdybeast@example.tld', 'parses email addresses completely')

t.equal(parsed.SPACED_KEY, 'parsed', 'parses keys and values surrounded by spaces')

t.equal(parsed.MULTI_DOUBLE_QUOTED, 'THIS\nIS\nA\nMULTILINE\nSTRING', 'parses multi-line strings when using double quotes')

t.equal(parsed.MULTI_SINGLE_QUOTED, 'THIS\nIS\nA\nMULTILINE\nSTRING', 'parses multi-line strings when using single quotes')

t.equal(parsed.MULTI_BACKTICKED, 'THIS\nIS\nA\n"MULTILINE\'S"\nSTRING', 'parses multi-line strings when using single quotes')

const payload = dotenv.parse(Buffer.from('BUFFER=true'))
t.equal(payload.BUFFER, 'true', 'should parse a buffer into an object')

const expectedPayload = { SERVER: 'localhost', PASSWORD: 'password', DB: 'tests' }

const RPayload = dotenv.parse(Buffer.from('SERVER=localhost\rPASSWORD=password\rDB=tests\r'))
t.same(RPayload, expectedPayload, 'can parse (\\r) line endings')

const NPayload = dotenv.parse(Buffer.from('SERVER=localhost\nPASSWORD=password\nDB=tests\n'))
t.same(NPayload, expectedPayload, 'can parse (\\n) line endings')

const RNPayload = dotenv.parse(Buffer.from('SERVER=localhost\r\nPASSWORD=password\r\nDB=tests\r\n'))
t.same(RNPayload, expectedPayload, 'can parse (\\r\\n) line endings')

const base64EncodedPayload = dotenv.parse(Buffer.from('SERVER=localhost\r\nPASSWORD=password\r\nDB=tests\r\n').toString('base64'))
t.same(base64EncodedPayload, expectedPayload, 'can parse base64 encoded payload into object')

const payloadBase64 = dotenv.parse(Buffer.from('BASE64=true').toString('base64'))
t.equal(payloadBase64.BASE64, 'true', 'should parse a base64 string into an object')

const RPayloadBase64 = dotenv.parse(Buffer.from('SERVER=localhost\rPASSWORD=password\rDB=tests\r').toString('base64'))
t.same(RPayloadBase64, expectedPayload, 'can parse (\\r) line endings in base64')

const NPayloadBase64 = dotenv.parse(Buffer.from('SERVER=localhost\nPASSWORD=password\nDB=tests\n').toString('base64'))
t.same(NPayloadBase64, expectedPayload, 'can parse (\\n) line endings in base64')

const RNPayloadBase64 = dotenv.parse(Buffer.from('SERVER=localhost\r\nPASSWORD=password\r\nDB=tests\r\n').toString('base64'))
t.same(RNPayloadBase64, expectedPayload, 'can parse (\\r\\n) line endings in base64')
