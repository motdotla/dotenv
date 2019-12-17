const t = require('tap')
const { covers } = require('../lib/utils')

t.equal(covers({}, {}), true, 'empty object should cover empty object')

t.equal(covers({ foo: null }, {}), true, 'any object should cover empty object')

t.equal(covers({}, { foo: null }), false, 'empty object should not cover anything other than empty object')

t.equal(covers({ foo: null }, { foo: null }), true, 'an object should cover itself')

t.equal(covers({ foo: null, bar: null }, { foo: null }), true, 'an object should cover another that has less keys')

t.equal(covers({ foo: null }, { foo: null, bar: null }), false, 'an object should not cover another that has extra keys')

t.equal(covers({ foo: null }, { bar: null }), false, 'an object should not cover another with different keys')

t.equal(covers({ foo: null, bar: null }, { foo: null, baz: null }), false, 'an object should not cover another with different keys even if they share some keys')
