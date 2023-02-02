const fs = require('fs')
const path = require('path')
const os = require('os')
const packageJson = require('../package.json')

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
    const unProcessedValue = (match[2] || '')
    const value = parseValue(unProcessedValue)
    // Add to object
    obj[key] = value
  }

  return obj
}

function parseValue (value) {
  // Remove whitespace
  const trimmedValue = value.trim()
  // Check if double quoted
  const maybeQuote = trimmedValue[0]
  // Remove surrounding quotes
  const valueNoQuotes = trimmedValue.replace(/^(['"`])([\s\S]*)\1$/mg, '$2')

  return unescapeValue(valueNoQuotes, maybeQuote)
}

function unescapeCharacters (value) {
  return value.replace(/\\([^$])/g, '$1')
}

function expandNewLines (value) {
  return value.replace(/\\n/g, '\n').replace(/\\r/g, '\r')
}

function unescapeValue (value, maybeQuote) {
  // Expand newlines if double quoted
  if (maybeQuote === '"') {
    return unescapeCharacters(expandNewLines(value))
  } else {
    return unescapeCharacters(value)
  }
}

function _log (message) {
  console.log(`[dotenv@${version}][DEBUG] ${message}`)
}

function _resolveHome (envPath) {
  return envPath[0] === '~' ? path.join(os.homedir(), envPath.slice(1)) : envPath
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

const DotenvModule = {
  config,
  parse
}

module.exports.config = DotenvModule.config
module.exports.parse = DotenvModule.parse
module.exports = DotenvModule
