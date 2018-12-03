/* @flow */

(function () {
  require('./lib/main').config(
    Object.assign({}, require('./lib/env-options')(process.env), require('./lib/cli-options')(process.argv))
  )
})()
