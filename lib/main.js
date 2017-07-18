'use strict'

var fs = require('fs')

/*
 * Parses a string or buffer into an object
 * @param {(string|Buffer)} src - source to be parsed
 * @returns {Object} keys and values from src
*/
function parse (src) {
  var obj = {}

  // certs
  var store_certs = [];
  var current_cert = '';
  var current_cert_key = '';
  var matching_cert = false;

  // convert Buffers before splitting into lines and processing
  src.toString().split('\n').forEach(function (line) {
    // line length
    var line_len = line ? line.length : 0;

    // matching "KEY' and 'VAL' in 'KEY=VAL'
    var keyValueArr = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/)
    // check if init cert declaration
    if ( /-----BEGIN/g.test(line) ) {
        matching_cert = true;
    }
    //
    if ( matching_cert ) {
        // check if end cert declaration
        if ( /-----END/g.test(line) && line_len > 0 && line.substring(line_len-5, line_len) === '-----' ) {
            current_cert += line + '\n';
            // strore
            store_certs.push({
                key: current_cert_key,
                value: current_cert
            });
            current_cert = '';
            current_cert_key = '';
            matching_cert = false;
        } else {
            // if unmatched?
            if ( keyValueArr === null ) {
                current_cert += line + '\n';
            } else {
                current_cert_key = keyValueArr[1];
                var value = keyValueArr[2] ? keyValueArr[2] : '';
                current_cert += value + '\n';
            }
        }
    } else {
        // matched?
        if ( keyValueArr != null ) {
            var key = keyValueArr[1]
            // default undefined or missing values to empty string
            var value = keyValueArr[2] ? keyValueArr[2] : ''
            // expand newlines in quoted values
            var len = value ? value.length : 0
            if ( len > 0 && value.charAt(0) === '"' && value.charAt(len - 1) === '"' ) {
                value = value.replace(/\\n/gm, '\n')
            }
            // remove any surrounding quotes and extra spaces
            value = value.replace(/(^['"]|['"]$)/g, '').trim()
            obj[key] = value
        }
    }
  });
  // if stored certs
  if ( store_certs.length > 0 ) {
      store_certs.forEach((item, i, array)=>{
          obj[item.key] = item.value;
      });
  }

  return obj
}

/*
 * Main entry point into dotenv. Allows configuration before loading .env
 * @param {Object} options - options for parsing .env file
 * @param {string} [options.path=.env] - path to .env file
 * @param {string} [options.encoding=utf8] - encoding of .env file
 * @returns {Object} parsed object or error
*/
function config (options) {
  var path = '.env'
  var encoding = 'utf8'

  if (options) {
    if (options.path) {
      path = options.path
    }
    if (options.encoding) {
      encoding = options.encoding
    }
  }

  try {
    // specifying an encoding returns a string instead of a buffer
    var parsedObj = parse(fs.readFileSync(path, { encoding: encoding }))

    Object.keys(parsedObj).forEach(function (key) {
      if (!process.env.hasOwnProperty(key)) {
        process.env[key] = parsedObj[key]
      }
    })

    return { parsed: parsedObj }
  } catch (e) {
    return { error: e }
  }
}

module.exports.config = config
module.exports.load = config
module.exports.parse = parse
