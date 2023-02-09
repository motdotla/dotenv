const fs = require('fs')
const path = require('path')
const os = require('os')
const packageJson = require('../package.json')
const MissingEnvVarsError = require('./missing-vars-error')

const version = packageJson.version

const LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg

// Parser src into an Object
function parse (src) {
  const obj = {}

  // Convert buffer to string
  let lines = src.toString()

  // Convert line breaks to same format
  lines = lines.replace(/\r\n?/mg, '\n')

  let match
  while ((match = LINE.exec(lines)) != null) {
    const key = match[1]

    // Default undefined or null to empty string
    let value = (match[2] || '')

    // Remove whitespace
    value = value.trim()

    // Check if double quoted
    const maybeQuote = value[0]

    // Remove surrounding quotes
    value = value.replace(/^(['"`])([\s\S]*)\1$/mg, '$2')

    // Expand newlines if double quoted
    if (maybeQuote === '"') {
      value = value.replace(/\\n/g, '\n')
      value = value.replace(/\\r/g, '\r')
    }

    // Add to object
    obj[key] = value
  }

  return obj
}

function _log (message) {
  console.log(`[dotenv@${version}][DEBUG] ${message}`)
}

function _resolveHome (envPath) {
  return envPath[0] === '~' ? path.join(os.homedir(), envPath.slice(1)) : envPath
}

function _compact (obj) {
  const result = {}
  Object.keys(obj).forEach(key => {
    if (obj[key]) result[key] = obj[key]
  })
  return result
}

function _difference (arrA, arrB) {
  return arrA.filter(a => arrB.indexOf(a) < 0)
}

// Populates process.env from .env file
function config (options) {
  let dotenvPath = path.resolve(process.cwd(), '.env')
  let encoding = 'utf8'
  const debug = Boolean(options && options.debug)
  const override = Boolean(options && options.override)

  if (options) {
    if (options.path != null) {
      dotenvPath = _resolveHome(options.path)
    }
    if (options.encoding != null) {
      encoding = options.encoding
    }
  }

  try {
    // Specifying an encoding returns a string instead of a buffer
    const parsed = DotenvModule.parse(fs.readFileSync(dotenvPath, { encoding }))

    Object.keys(parsed).forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
        process.env[key] = parsed[key]
      } else {
        if (override === true) {
          process.env[key] = parsed[key]
        }

        if (debug) {
          if (override === true) {
            _log(`"${key}" is already defined in \`process.env\` and WAS overwritten`)
          } else {
            _log(`"${key}" is already defined in \`process.env\` and was NOT overwritten`)
          }
        }
      }
    })

    return { parsed }
  } catch (e) {
    if (debug) {
      _log(`Failed to load ${dotenvPath} ${e.message}`)
    }

    return { error: e }
  }
}

function safe (options = {}) {
  const dotenvResult = config(options)
  const example = options.example || options.sample || '.env.example'
  const allowEmptyValues = options.allowEmptyValues || false
  const encoding = options.encoding || 'utf8'
  const processEnv = allowEmptyValues ? process.env : _compact(process.env)
  const exampleVars = parse(fs.readFileSync(example, { encoding }))
  const missing = _difference(Object.keys(exampleVars), Object.keys(processEnv))

  if (missing.length > 0) {
    throw new MissingEnvVarsError(allowEmptyValues, options.path || '.env', example, missing, dotenvResult.error)
  }

  // Key/value pairs defined in example file and resolved from environment
  const required = Object.keys(exampleVars).reduce((acc, key) => {
    acc[key] = process.env[key]
    return acc
  }, {})
  const error = dotenvResult.error ? { error: dotenvResult.error } : {}
  const result = {
    parsed: dotenvResult.error ? {} : dotenvResult.parsed,
    required: required
  }
  return Object.assign(result, error)
}

const DotenvModule = {
  config,
  parse,
  safe
}

module.exports.config = DotenvModule.config
module.exports.parse = DotenvModule.parse
module.exports.safe = DotenvModule.safe
module.exports = DotenvModule
