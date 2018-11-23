/* @flow */

const re = /^dotenv_config_(encoding|path|debug)$/

module.exports = function optionMatcher () {
  return Object.entries(process.env).reduce(function (acc, [key, val]) {
    const matches = key.match(re)
    if (matches) {
      acc[matches[1]] = val
    }
    return acc
  }, {})
}
