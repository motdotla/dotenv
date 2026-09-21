const fs = require('fs')
const path = require('path')
const os = require('os')
const { URL, fileURLToPath } = require('url')

const { parseBoolean, optionsFromEnv } = require('./config-options')

const LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg

// From #1010 (homanp) — hand-written character scanner
const KEY_CHAR = new Uint8Array(256)
for (let _i = 48; _i <= 57; _i++) KEY_CHAR[_i] = 1
for (let _i = 65; _i <= 90; _i++) KEY_CHAR[_i] = 1
for (let _i = 97; _i <= 122; _i++) KEY_CHAR[_i] = 1
KEY_CHAR[45] = 1 // -
KEY_CHAR[46] = 1 // .
KEY_CHAR[95] = 1 // _

// Classic regex parser (default)
function parseRegex (src) {
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

// JavaScript whitespace, with the common ASCII cases checked first.
function isWhitespace (c) {
  return c === 32 || (c >= 9 && c <= 13) || c === 160 || c === 5760 ||
    (c >= 8192 && c <= 8202) || c === 8232 || c === 8233 ||
    c === 8239 || c === 8287 || c === 12288 || c === 65279
}

// Parse src into an Object — hand-written character scanner.
// Via https://github.com/motdotla/dotenv/pull/1010 — opt-in via { fast: true }
function parseFast (src) {
  const obj = {}
  let str = typeof src === 'string' ? src : src.toString()
  if (str.indexOf('\r') !== -1) {
    str = str.replace(/\r\n?/g, '\n')
  }
  const len = str.length
  let i = 0

  while (i < len) {
    let c = str.charCodeAt(i)

    // skip whitespace / blank lines
    while (i < len && isWhitespace(c)) {
      i++
      c = str.charCodeAt(i)
    }
    if (i >= len) break

    // comment line
    if (c === 35 /* # */) {
      while (i < len && str.charCodeAt(i) !== 10) i++
      continue
    }

    // optional 'export' prefix followed by whitespace
    if (c === 101 /* e */ && i + 6 < len &&
        str.charCodeAt(i + 1) === 120 &&
        str.charCodeAt(i + 2) === 112 &&
        str.charCodeAt(i + 3) === 111 &&
        str.charCodeAt(i + 4) === 114 &&
        str.charCodeAt(i + 5) === 116) {
      const nc = str.charCodeAt(i + 6)
      if (isWhitespace(nc)) {
        i += 7
        while (i < len && isWhitespace(str.charCodeAt(i))) i++
      } else {
        c = str.charCodeAt(i)
      }
    }

    // key: [A-Za-z0-9_.-]+ via lookup
    const keyStart = i
    let stop = 0
    while (i < len) {
      stop = str.charCodeAt(i)
      if (KEY_CHAR[stop]) i++
      else break
    }
    if (i === keyStart) {
      while (i < len && str.charCodeAt(i) !== 10) i++
      continue
    }
    const key = str.slice(keyStart, i)
    const keyEnd = i
    if (i >= len) stop = 0

    // skip whitespace before separator
    if (isWhitespace(stop)) {
      do { i++; stop = i < len ? str.charCodeAt(i) : 0 } while (isWhitespace(stop))
    }

    if (stop === 61 /* = */) {
      i++
    } else if (stop === 58 /* : */ && i + 1 < len && isWhitespace(str.charCodeAt(i + 1))) {
      i++
    } else {
      // invalid line — skip
      // Whitespace lookahead may have crossed a newline; do not discard
      // the next assignment when this key has no separator.
      i = keyEnd
      while (i < len && str.charCodeAt(i) !== 10) i++
      continue
    }

    // Quoted alternatives may cross whitespace and blank lines. Keep the
    // original start for unquoted values if no complete quoted value matches.
    const rawStart = i
    let quoteStart = i
    while (quoteStart < len && isWhitespace(str.charCodeAt(quoteStart))) quoteStart++
    const quote = str.charCodeAt(quoteStart)
    let value
    let quoted = false

    if (quote === 39 || quote === 34 || quote === 96) {
      let j = quoteStart + 1
      while (j < len) {
        const cc = str.charCodeAt(j)
        if (cc === 92 && j + 1 < len) {
          const next = str.charCodeAt(j + 1)
          if (next === quote || next === 92) {
            j += 2
            continue
          }
        }
        if (cc === quote) break
        j++
      }
      if (j < len) {
        let end = j + 1
        while (end < len && str.charCodeAt(end) !== 10 && isWhitespace(str.charCodeAt(end))) end++
        // After whitespace, a closing quote must end the line or start a comment.
        // Otherwise the entire first line is an unquoted value.
        if (end === len || str.charCodeAt(end) === 10 || str.charCodeAt(end) === 35) {
          value = str.slice(quoteStart + 1, j)
          i = end
          if (str.charCodeAt(i) === 35) {
            while (i < len && str.charCodeAt(i) !== 10) i++
          }
          quoted = true
        }
      }
    }

    if (!quoted) {
      // Unquoted values stop at a comment or newline, even if they begin
      // with an unterminated quote or contain separate quoted segments.
      let nl = str.indexOf('\n', rawStart)
      if (nl === -1) nl = len
      let hash = str.indexOf('#', rawStart)
      if (hash === -1 || hash > nl) hash = nl
      let start = rawStart
      let end = hash
      while (start < end && isWhitespace(str.charCodeAt(start))) start++
      while (end > start && isWhitespace(str.charCodeAt(end - 1))) end--
      const first = str.charCodeAt(start)
      if (end - start >= 2 && (first === 39 || first === 34 || first === 96) && str.charCodeAt(end - 1) === first) {
        value = str.slice(start + 1, end - 1)
      } else {
        value = str.slice(start, end)
      }
      i = nl
    }

    // Expansion depends on the opening quote, even if it never closes.
    // For unquoted fallback, only consider the value on the original line.
    if (quote === 34 && (quoted || quoteStart < i) && value.indexOf('\\') !== -1) {
      value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r')
    }

    obj[key] = value
  }

  return obj
}

// Parse src into an Object
function parse (src, options) {
  if (options && parseBoolean(options.fast)) {
    return parseFast(src)
  }
  return parseRegex(src)
}

function _debug (message) {
  console.log(`┆ ${message}`)
}

function _log (message) {
  console.error(`◇ ${message}`)
}

function _resolveHome (envPath) {
  return envPath[0] === '~' ? path.join(os.homedir(), envPath.slice(1)) : envPath
}

function _configOptions (options = {}) {
  return { ...optionsFromEnv(), ...options }
}

function configDotenv (options) {
  options = _configOptions(options)
  const dotenvPath = path.resolve(process.cwd(), '.env')
  let encoding = 'utf8'
  let processEnv = process.env
  if (options && options.processEnv != null) {
    processEnv = options.processEnv
  }
  const debug = parseBoolean(options && options.debug)
  const quiet = parseBoolean(options && options.quiet)

  if (options && options.encoding) {
    encoding = options.encoding
  } else {
    if (debug) {
      _debug('no encoding is specified (UTF-8 is used by default)')
    }
  }

  let optionPaths = [dotenvPath] // default, look for .env
  if (options && options.path) {
    if (!Array.isArray(options.path)) {
      optionPaths = [_resolveHome(options.path)]
    } else {
      optionPaths = [] // reset default
      for (const filepath of options.path) {
        optionPaths.push(_resolveHome(filepath))
      }
    }
  }

  // Build the parsed data in a temporary object (because we need to return it).  Once we have the final
  // parsed data, we will combine it with process.env (or options.processEnv if provided).
  let lastError
  const parsedAll = {}
  const parseOptions = { fast: options.fast }
  for (const path of optionPaths) {
    try {
      // Specifying an encoding returns a string instead of a buffer
      const parsed = DotenvModule.parse(fs.readFileSync(path, { encoding }), parseOptions)

      DotenvModule.populate(parsedAll, parsed, options)
    } catch (e) {
      if (debug) {
        _debug(`failed to load ${path} ${e.message}`)
      }
      lastError = e
    }
  }

  const populated = DotenvModule.populate(processEnv, parsedAll, options)

  if (debug || !quiet) {
    const keysCount = Object.keys(populated).length
    const shortPaths = []
    for (const filePath of optionPaths) {
      try {
        const relative = path.relative(process.cwd(), filePath instanceof URL ? fileURLToPath(filePath) : filePath)
        shortPaths.push(relative)
      } catch (e) {
        if (debug) {
          _debug(`failed to load ${filePath} ${e.message}`)
        }
        lastError = e
      }
    }

    _log(`injected env (${keysCount}) from ${shortPaths.join(',')}`)
  }

  if (lastError) {
    return { parsed: parsedAll, error: lastError }
  } else {
    return { parsed: parsedAll }
  }
}

// Populates process.env from .env file
function config (options) {
  return DotenvModule.configDotenv(options)
}

// Populate process.env with parsed values
function populate (processEnv, parsed, options = {}) {
  const debug = Boolean(options && options.debug)
  const override = Boolean(options && options.override)
  const populated = {}

  if (processEnv === null || typeof processEnv !== 'object' || parsed === null || typeof parsed !== 'object') {
    const err = new Error('OBJECT_REQUIRED: Please check the processEnv argument being passed to populate')
    err.code = 'OBJECT_REQUIRED'
    throw err
  }

  // Set process.env
  for (const key of Object.keys(parsed)) {
    if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
      if (override === true) {
        processEnv[key] = parsed[key]
        populated[key] = parsed[key]
      }

      if (debug) {
        if (override === true) {
          _debug(`"${key}" is already defined and WAS overwritten`)
        } else {
          _debug(`"${key}" is already defined and was NOT overwritten`)
        }
      }
    } else {
      processEnv[key] = parsed[key]
      populated[key] = parsed[key]
    }
  }

  return populated
}

const DotenvModule = {
  configDotenv,
  config,
  parse,
  populate
}

module.exports.configDotenv = DotenvModule.configDotenv
module.exports.config = DotenvModule.config
module.exports.parse = DotenvModule.parse
module.exports.populate = DotenvModule.populate

module.exports = DotenvModule
