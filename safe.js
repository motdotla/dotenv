(function () {
  require('./lib/main').safe(
    Object.assign(
      {},
      require('./lib/env-options'),
      require('./lib/cli-options')(process.argv)
    )
  )
})()
