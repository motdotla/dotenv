module.exports = function (args) {
  return args.reduce(function (options, val) {
    var matches = val.match(/^dotenv_config_([^=]+)=(.+)$/)
    if (matches) {
      options[matches[1]] = matches[2]
    }
    return options
  }, {})
}
