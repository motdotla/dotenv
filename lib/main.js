'use strict'

var fs = require('fs')

module.exports = {
  /*
   * Main entry point into dotenv. Allows configuration before loading .env
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

      return parsedObj
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
      // matching "KEY' and 'VAL' in 'KEY=VAL', preliminarily trimming them of leading/trailing whitespace
      var keyValueArr = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*?)\s*$/)
      // matched?
      if (keyValueArr != null) {
        var key = keyValueArr[1]

        // default undefined or missing values to empty string
        var value = keyValueArr[2] ? keyValueArr[2] : ''

        // test if there's valid quoting. check end first - value's last char should either be a quote, or there should be a quote-whitespace-hash combination somewhere (ending quote followed by comment)
        var validEndingQuote = /(['"])$/.exec(value.slice(1)) || /(['"])\s+#/.exec(value.slice(1)) // will be exec result array, or null. Slice 1st char so a starting quote (if present) can't be misidentified as an ending one.
        if (validEndingQuote && value.charAt(0) === validEndingQuote[1]) { // end could be single or double, first char must match.
          // quoted mode.
          value = value.substring(1, validEndingQuote.index + 1) // +1 to counter effects of prior 1st-char slice.
          if (validEndingQuote[1] === '"') value = value.replace(/\\n/gm, '\n') // For double-quoteds, expand newlines.
        } else {
          // unquoted mode.
          value = value.replace(/\s+#.*/, '') // remove EOL-comments, if present.
        }

        obj[key] = value
      }
    })

    return obj
  }

}

module.exports.load = module.exports.config
