(function () {
  require('./lib/main').config(
    require('./lib/cli-options')(process.argv.slice(1)) // skip first argv, which is node command
  )
})()
