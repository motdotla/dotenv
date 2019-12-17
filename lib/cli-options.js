/* @flow */

const re = /^dotenv_config_(encoding|path|debug|example_path|default_path|extended)=(.+)$/

const map = {
  encoding: 'encoding',
  path: 'path',
  debug: 'debug',
  example_path: 'examplePath',
  default_path: 'defaultPath',
  extended: 'extended'
}

module.exports = function optionMatcher (args /*: Array<string> */) {
  return args.reduce(function (acc, cur) {
    const matches = cur.match(re)
    if (matches) {
      acc[map[matches[1]]] = matches[2]
    }
    return acc
  }, {})
}
