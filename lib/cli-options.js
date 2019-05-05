/* @flow */

const re = /^dotenv_config_(debug|encoding|multiConfig|path)=(.+)$/

module.exports = function optionMatcher (args /*: Array<string> */) {
  return args.reduce(function (acc, cur) {
    const matches = cur.match(re)
    if (matches) {
      acc[matches[1]] = matches[2]
    }
    return acc
  }, {})
}
