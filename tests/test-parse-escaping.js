const fs = require('fs')
const t = require('tap')

const dotenv = require('../lib/main')

const parsed = dotenv.parse(fs.readFileSync('tests/.env-escaping', { encoding: 'utf8' }))

t.type(parsed, Object, 'should return an object')

t.equal(parsed.ESCAPE_CHAR, 'abcde', 'a "regular" escaped character should not be modified by un-escaping')

t.equal(parsed.ESCAPE_QUOTES, 'single quote: \', double quote: ", backtick: `', 'quote characters can be escaped just like any other "regular" character')

t.equal(parsed.ESCAPE_NEWLINE_NO_QUOTE, 'line1nline2', 'without double quotes `\\n` is un-escaped to `n`')

t.equal(parsed.ESCAPE_NEWLINE_IN_DOUBLE_QUOTE, 'line1\nline2', 'with double quotes `\\n` is expanded to `\n`')

t.equal(parsed.ESCAPE_TAB, 't', '\\t has no special meaning (expansion) in this library')

t.equal(parsed.ESCAPE_QUOTES_IN_QUOTES, 'John said: "Lets go"', 'quotes can be escaped inside quoted dotenv value')

t.equal(parsed.ESCAPE_DOLLAR, '\\$\\$\\$', 'dollar sign is never escaped')
