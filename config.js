/* @flow */

(function () {
  require('./lib/main').config(
    {
      ...require('./lib/cli-options')(process.argv),
      ...require('./lib/env-options')()
    }
  )
})()
