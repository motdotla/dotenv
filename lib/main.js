const fs = require('fs')
const path = require('path')
const os = require('os')

function parseBoolean (value) {
  if (typeof value === 'string') {
    return !['false', '0', 'no', 'off', ''].includes(value.toLowerCase())
  }
  return Boolean(value)
}

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

// Parse src into an Object — hand-written character scanner (no regex in hot path)
// Via https://github.com/motdotla/dotenv/pull/1010
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

    // skip whitespace / blank lines (\r already normalized out)
    while (i < len && (c === 32 || c === 9 || c === 10)) {
      i++
      c = str.charCodeAt(i)
    }
    if (i >= len) break

    // comment line
    if (c === 35 /* # */) {
      while (i < len && str.charCodeAt(i) !== 10) i++
      continue
    }

    // optional 'export' prefix: 'export' followed by space/tab
    if (c === 101 /* e */ && i + 6 < len &&
        str.charCodeAt(i + 1) === 120 &&
        str.charCodeAt(i + 2) === 112 &&
        str.charCodeAt(i + 3) === 111 &&
        str.charCodeAt(i + 4) === 114 &&
        str.charCodeAt(i + 5) === 116) {
      const nc = str.charCodeAt(i + 6)
      if (nc === 32 || nc === 9) {
        i += 7
        while (i < len && ((c = str.charCodeAt(i)) === 32 || c === 9)) i++
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
    if (i >= len) stop = 0

    // skip spaces/tabs before separator
    if (stop === 32 || stop === 9) {
      do { i++; stop = i < len ? str.charCodeAt(i) : 0 } while (stop === 32 || stop === 9)
    }

    if (stop === 61 /* = */) {
      i++
    } else if (stop === 58 /* : */ && i + 1 < len && (str.charCodeAt(i + 1) === 32 || str.charCodeAt(i + 1) === 9)) {
      i++
    } else {
      // invalid line — skip
      while (i < len && str.charCodeAt(i) !== 10) i++
      continue
    }

    // skip spaces/tabs after separator
    while (i < len && ((c = str.charCodeAt(i)) === 32 || c === 9)) i++

    let value
    c = i < len ? str.charCodeAt(i) : 0

    if (c === 39 /* ' */ || c === 34 /* " */ || c === 96 /* ` */) {
      const quote = c
      const vStart = i + 1
      let j = vStart
      while (j < len) {
        const cc = str.charCodeAt(j)
        if (cc === 92 /* \ */ && j + 1 < len && str.charCodeAt(j + 1) === quote) {
          j += 2
        } else if (cc === quote) {
          break
        } else {
          j++
        }
      }
      if (j >= len) {
        // unterminated quote — fall back to unquoted-from-here semantics
        const uStart = i
        let k = i
        while (k < len) {
          const cc = str.charCodeAt(k)
          if (cc === 35 || cc === 10) break
          k++
        }
        let end = k
        while (end > uStart) {
          const cc = str.charCodeAt(end - 1)
          if (cc === 32 || cc === 9) end--
          else break
        }
        value = str.slice(uStart, end)
        i = k
        if (i < len && str.charCodeAt(i) === 35) {
          while (i < len && str.charCodeAt(i) !== 10) i++
        }
      } else {
        value = str.slice(vStart, j)
        i = j + 1
        if (quote === 34 && value.indexOf('\\') !== -1) {
          value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r')
        }
        // trailing ws + optional comment
        while (i < len && ((c = str.charCodeAt(i)) === 32 || c === 9)) i++
        if (i < len && str.charCodeAt(i) === 35) {
          while (i < len && str.charCodeAt(i) !== 10) i++
        }
      }
    } else {
      // unquoted: up to # \n. indexOf for fast \n seek.
      const vStart = i
      let nl = str.indexOf('\n', i)
      if (nl === -1) nl = len
      let hash = str.indexOf('#', i)
      if (hash === -1 || hash > nl) hash = nl
      let end = hash
      while (end > vStart) {
        const cc = str.charCodeAt(end - 1)
        if (cc === 32 || cc === 9) end--
        else break
      }
      value = vStart === end ? '' : str.slice(vStart, end)
      i = hash === nl ? hash : nl
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
  const defaults = {}

  if (process.env.DOTENV_CONFIG_ENCODING != null) defaults.encoding = process.env.DOTENV_CONFIG_ENCODING
  if (process.env.DOTENV_CONFIG_PATH != null) defaults.path = process.env.DOTENV_CONFIG_PATH
  if (process.env.DOTENV_CONFIG_QUIET != null) defaults.quiet = parseBoolean(process.env.DOTENV_CONFIG_QUIET)
  if (process.env.DOTENV_CONFIG_DEBUG != null) defaults.debug = parseBoolean(process.env.DOTENV_CONFIG_DEBUG)
  if (process.env.DOTENV_CONFIG_OVERRIDE != null) defaults.override = parseBoolean(process.env.DOTENV_CONFIG_OVERRIDE)
  if (process.env.DOTENV_CONFIG_SECURE != null) defaults.secure = parseBoolean(process.env.DOTENV_CONFIG_SECURE)

  return { ...defaults, ...options }
}

function _hasEncryptedValues (parsed) {
  for (const key of Object.keys(parsed)) {
    const value = parsed[key]
    if (typeof value === 'string' && value.indexOf('encrypted:') === 0) {
      return true
    }
  }
  return false
}

function _requireDotenvx () {
  try {
    return require(require.resolve('@dotenvx/dotenvx', { paths: [process.cwd()] }))
  } catch (_) {
    return null
  }
}

function _secureRequiresDotenvxError () {
  const err = new Error('SECURE_REQUIRES_DOTENVX: config({ secure: true }) requires @dotenvx/dotenvx. Install with: npm i @dotenvx/dotenvx')
  err.code = 'SECURE_REQUIRES_DOTENVX'
  return err
}

function configSecure (options) {
  const dotenvx = _requireDotenvx()
  if (!dotenvx || typeof dotenvx.config !== 'function') {
    console.error('dotenv: secure requires dotenvx')
    console.error('  npm i @dotenvx/dotenvx')
    console.error('  # or: curl -sfS https://dotenvx.sh | sh')
    return { error: _secureRequiresDotenvxError() }
  }

  return dotenvx.config({
    path: options.path,
    encoding: options.encoding,
    quiet: options.quiet,
    debug: options.debug,
    override: options.override,
    processEnv: options.processEnv
  })
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
  for (const path of optionPaths) {
    try {
      // Specifying an encoding returns a string instead of a buffer
      const parsed = DotenvModule.parse(fs.readFileSync(path, { encoding }))

      DotenvModule.populate(parsedAll, parsed, options)
    } catch (e) {
      if (debug) {
        _debug(`failed to load ${path} ${e.message}`)
      }
      lastError = e
    }
  }

  const encrypted = _hasEncryptedValues(parsedAll)
  const populated = DotenvModule.populate(processEnv, parsedAll, options)

  if (debug || !quiet) {
    const keysCount = Object.keys(populated).length
    const shortPaths = []
    for (const filePath of optionPaths) {
      try {
        const relative = path.relative(process.cwd(), filePath)
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

  if (encrypted) {
    console.error('┆ encrypted values detected — use: require(\'dotenv\').config({ secure: true })')
  }

  if (lastError) {
    return { parsed: parsedAll, error: lastError }
  } else {
    return { parsed: parsedAll }
  }
}

// Populates process.env from .env file
function config (options) {
  options = _configOptions(options)

  if (parseBoolean(options.secure)) {
    return configSecure(options)
  }

  return DotenvModule.configDotenv(options)
}

// Populate process.env with parsed values
function populate (processEnv, parsed, options = {}) {
  const debug = Boolean(options && options.debug)
  const override = Boolean(options && options.override)
  const populated = {}

  if (typeof parsed !== 'object') {
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
