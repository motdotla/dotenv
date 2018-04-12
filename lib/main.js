'use strict'

const fs = require('fs')
const path = require('path')

/*
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
      let value = keyValueArr[2] || ''

      // expand newlines in quoted values
      const len = value ? value.length : 0
      if (len > 0 && value.charAt(0) === '"' && value.charAt(len - 1) === '"') {
        value = value.replace(/\\n/gm, '\n')
      }

      // remove any surrounding quotes and extra spaces
      value = value.replace(/(^['"]|['"]$)/g, '').trim()

      obj[key] = value
    }
  })

  return obj
}

/* Decrypt an encrypted dotenv file
 * @param {string} dotenvcryptPath - path to .env.crypt file
 * @returns {string} decrypted file contents
*/

function decrypt (dotenvcryptPath) {
  let file, pass, buff, salt, data, k1, k2, key, iv, aes, out
  let crypto = require('crypto')

  // read encrypted file and password
  file = fs.readFileSync(dotenvcryptPath, 'utf8')
  pass = process.env['DOTENVCRYPT'] || fs.readFileSync(dotenvcryptPath + 'key', 'utf8')
  pass = pass.replace(/\r?\n.*$/mg, '')

  // read salt and encrypted data
  buff = new Buffer(file, 'base64')
  salt = buff.toString('binary', 8, 16)
  data = buff.toString('binary', 16)

  // construct key components and initialization vector
  k1 = crypto.createHash('md5').update(     pass + salt, 'binary').digest('binary')
  k2 = crypto.createHash('md5').update(k1 + pass + salt, 'binary').digest('binary')
  iv = crypto.createHash('md5').update(k2 + pass + salt, 'binary').digest('binary')

  // construct buffers for the key and initialization vector
  key = new Buffer(k1 + k2, 'binary')
  iv  = new Buffer(iv     , 'binary')

  // decrypt the data
  aes = crypto.createDecipheriv('aes-256-cbc', key, iv)
  out = aes.update(data, 'binary', 'utf8')
  out += aes.final('utf8')

  return out
}

/*
 * Main entry point into dotenv. Allows configuration before loading .env
 * @param {Object} options - options for parsing .env file
 * @param {string} [options.path=.env] - path to .env file
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
    let source
    if (!fs.existsSync(dotenvPath           ) &&
         fs.existsSync(dotenvPath + '.crypt') && (
         fs.existsSync(dotenvPath + '.cryptkey') ||
         process.env.hasOwnProperty('DOTENVCRYPT'))) {
      source = decrypt(dotenvPath + '.crypt')
    } else {
      // specifying an encoding returns a string instead of a buffer
      source = fs.readFileSync(dotenvPath, { encoding })
    }
    const parsed = parse(source)

    Object.keys(parsed).forEach(function (key) {
      if (!process.env.hasOwnProperty(key)) {
        process.env[key] = parsed[key]
      }
    })

    return { parsed }
  } catch (e) {
    return { error: e }
  }
}

module.exports.config = config
module.exports.load = config
module.exports.parse = parse
