'use strict'

const fs = require('fs')
const path = require('path')

/**
 * Parses a string or buffer into an object
 * @param {(string|Buffer)} src - source to be parsed
 * @returns {Object} keys and values from src
*/
function parse (src) {
  const obj = {}

  // convert Buffers before splitting into lines and processing
  src.toString().split('\n').forEach(function (line) {
    // matching "KEY' and 'VAL' in 'KEY=VAL'
    const keyValueArr = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/)
    // matched?
    if (keyValueArr != null) {
      const key = keyValueArr[1]

      // default undefined or missing values to empty string
      /** @type {string|number|boolean} */
      let value = keyValueArr[2] || ''

      // expand newlines in quoted values
      const len = value ? value.length : 0
      if (len > 0 && value.charAt(0) === '"' && value.charAt(len - 1) === '"') {
        value = value.replace(/\\n/gm, '\n')
      }

      // remove any surrounding quotes and extra spaces
      value = value.replace(/(^['"]|['"]$)/g, '').trim()

      // convert numeric strings to numbers
      if (value.match(/^-?(\d|\.)+$/) && value.split('.').length <= 2) {
        value = parseFloat(value)
      }
      // convert true/false strings to booleans
      else if (value.match(/^(true|false)$/i)) {
        value = value === 'true'
      }
      // Attempt to convert json strings to objects
      else {
        try { value = JSON.parse(value) } catch (e) { }
      }

      obj[key] = value
    }
  })

  return obj
}

/**
 * Main entry point into dotenv. Allows configuration before loading .env
 * @param {Object} options - options for parsing .env file
 * @param {string} [options.path='.env'] - path to .env file
 * @param {string} [options.encoding=utf8] - encoding of .env file
 * @returns {Object} parsed object or error
*/
function config (options) {
  let dotenvPath = path.resolve(process.cwd(), '.env')
  let encoding = 'utf8'

  if (options) {
    if (options.path) {
      dotenvPath = options.path
    }
    if (options.encoding) {
      encoding = options.encoding
    }
  }

  try {
    // specifying an encoding returns a string instead of a buffer
    const parsed = parse(fs.readFileSync(dotenvPath, { encoding }))

    Object.keys(parsed).forEach(function (key) {
      if (!process.env.hasOwnProperty(key)) {
        process.env[key] = parsed[key]
      }
    })

    return {
      parsed,
      /**
       * Gets a value from the parsed object, if it doesn't exist return the default
       *
       * @param {string} key The environment key
       * @param {any} [defaultValue=''] A fallback value to return
       */
      get: function (key, defaultValue = '') {
        return typeof this.parsed[key] !== 'undefined' ? this.parsed[key] : defaultValue
      },
      /**
       * Adds a key to the parsed object only if it doesn't exist
       *
       * @param {string} key The key to add
       * @param {any} value The value of the key
       */
      add: function (key, value) {
        typeof this.parsed[key] === 'undefined' && this.set(key, value)
      },
      /**
       * Sets the value of a key, the key is created if it doesn't exist
       *
       * @param {string} key The key to add
       * @param {any} value The value of the key
       */
      set: function (key, value) {
        process.env[key] = value
        this.parsed[key] = value
      }
    }
  } catch (e) {
    return { error: e }
  }
}

module.exports.config = config
module.exports.load = config
module.exports.parse = parse
