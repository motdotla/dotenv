'use strict'

var fs = require('fs')

module.exports = {
  /*
   * Main entry point into dotenv. Allows configuration before loading .env and .env.$NODE_ENV
   * @param {Object} options - valid options: path ('.env'), encoding ('utf8')
   * @returns {Boolean}
  */
  config: function (options) {
    var path = '.env'
    var encoding = 'utf8'
    var silent = false

    if (options) {
      if (options.silent) {
        silent = options.silent
      }
      if (options.path) {
        path = options.path
      }
      if (options.encoding) {
        encoding = options.encoding
      }
    }

    try {
      // specifying an encoding returns a string instead of a buffer
      var parsedObj = this.parse(fs.readFileSync(path, { encoding: encoding }))

      Object.keys(parsedObj).forEach(function (key) {
        process.env[key] = process.env[key] || parsedObj[key]
      })

      return true
    } catch (e) {
      if (!silent) {
        console.error(e)
      }
      return false
    }
  },

  /*
   * Parses a string or buffer into an object
   * @param {String|Buffer} src - source to be parsed
   * @returns {Object}
  */
  parse: function (src) {
    var obj = {}

    // convert Buffers before splitting into lines and processing
    src.toString().split('\n').forEach(function (line) {
      // matching "KEY' and 'VAL' in 'KEY=VAL'
      var keyValueArr = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/)
      // matched?
      if (keyValueArr != null) {
        var key = keyValueArr[1]

        // default undefined or missing values to empty string
        var value = keyValueArr[2] ? keyValueArr[2] : ''

        // expand newlines in quoted values
        var len = value ? value.length : 0
        if (len > 0 && value.charAt(0) === '\"' && value.charAt(len - 1) === '\"') {
          value = value.replace(/\\n/gm, '\n')
        }

        var isSingleQuoted = value.charAt(0) === '\'' && value.charAt(len - 1) === '\''

        // remove any surrounding quotes and extra spaces
        value = value.replace(/(^['"]|['"]$)/g, '').trim()

        // match and replace variables
        if (!isSingleQuoted) {
          value = value.replace(/\\?\${?[^}]*}?/g, function (match) {
            var possibleVar
            var len = match.length

            // variable can be escaped with a \$
            if (match.charAt(0) === '\\') {
              return match.substring(1)
            }

            if (match.charAt(1) === '{') {
              // if there is an opening brace there must be a closing one
              if (match.charAt(len - 1) !== '}') {
                return match
              }
              possibleVar = match.slice(2, -1)
            } else {
              possibleVar = match.substring(1)
            }

            return obj[possibleVar] || process.env[possibleVar] || ''
          })
        }

        obj[key] = value
      }
    })

    return obj
  }

}

module.exports.load = module.exports.config
