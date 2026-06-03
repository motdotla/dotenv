const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')

// Array of tips to display randomly
const TIPS = [
  '◈ encrypted .env [www.dotenvx.com]',
  '◈ secrets for agents [www.dotenvx.com]',
  '✦ add agent skills [npx skills add motdotla/dotenv]',
  '⌁ auth for agents [www.vestauth.com]',
  '⌘ custom filepath { path: \'/custom/path/.env\' }',
  '⌘ enable debugging { debug: true }',
  '⌘ override existing { override: true }',
  '⌘ suppress logs { quiet: true }',
  '⌘ multiple files { path: [\'.env.local\', \'.env\'] }'
]

// Get a random tip from the tips array
function _getRandomTip () {
  return TIPS[Math.floor(Math.random() * TIPS.length)]
}

function parseBoolean (value) {
  if (typeof value === 'string') {
    return !['false', '0', 'no', 'off', ''].includes(value.toLowerCase())
  }
  return Boolean(value)
}

function supportsAnsi () {
  return process.stdout.isTTY // && process.env.TERM !== 'dumb'
}

function dim (text) {
  return supportsAnsi() ? `\x1b[2m${text}\x1b[0m` : text
}

const KEY_CHAR = new Uint8Array(256)
for (let _i = 48; _i <= 57; _i++) KEY_CHAR[_i] = 1
for (let _i = 65; _i <= 90; _i++) KEY_CHAR[_i] = 1
for (let _i = 97; _i <= 122; _i++) KEY_CHAR[_i] = 1
KEY_CHAR[45] = 1; KEY_CHAR[46] = 1; KEY_CHAR[95] = 1

// Parse src into an Object — hand-written character scanner (no regex in hot path)
function parse (src) {
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

function _parseVault (options) {
  options = options || {}

  const vaultPath = _vaultPath(options)
  options.path = vaultPath // parse .env.vault
  const result = DotenvModule.configDotenv(options)
  if (!result.parsed) {
    const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`)
    err.code = 'MISSING_DATA'
    throw err
  }

  // handle scenario for comma separated keys - for use with key rotation
  // example: DOTENV_KEY="dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=prod,dotenv://:key_7890@dotenvx.com/vault/.env.vault?environment=prod"
  const keys = _dotenvKey(options).split(',')
  const length = keys.length

  let decrypted
  for (let i = 0; i < length; i++) {
    try {
      // Get full key
      const key = keys[i].trim()

      // Get instructions for decrypt
      const attrs = _instructions(result, key)

      // Decrypt
      decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key)

      break
    } catch (error) {
      // last key
      if (i + 1 >= length) {
        throw error
      }
      // try next key
    }
  }

  // Parse decrypted .env string
  return DotenvModule.parse(decrypted)
}

function _warn (message) {
  console.error(`⚠ ${message}`)
}

function _debug (message) {
  console.log(`┆ ${message}`)
}

function _log (message) {
  console.log(`◇ ${message}`)
}

function _dotenvKey (options) {
  // prioritize developer directly setting options.DOTENV_KEY
  if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
    return options.DOTENV_KEY
  }

  // secondary infra already contains a DOTENV_KEY environment variable
  if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
    return process.env.DOTENV_KEY
  }

  // fallback to empty string
  return ''
}

function _instructions (result, dotenvKey) {
  // Parse DOTENV_KEY. Format is a URI
  let uri
  try {
    uri = new URL(dotenvKey)
  } catch (error) {
    if (error.code === 'ERR_INVALID_URL') {
      const err = new Error('INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development')
      err.code = 'INVALID_DOTENV_KEY'
      throw err
    }

    throw error
  }

  // Get decrypt key
  const key = uri.password
  if (!key) {
    const err = new Error('INVALID_DOTENV_KEY: Missing key part')
    err.code = 'INVALID_DOTENV_KEY'
    throw err
  }

  // Get environment
  const environment = uri.searchParams.get('environment')
  if (!environment) {
    const err = new Error('INVALID_DOTENV_KEY: Missing environment part')
    err.code = 'INVALID_DOTENV_KEY'
    throw err
  }

  // Get ciphertext payload
  const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`
  const ciphertext = result.parsed[environmentKey] // DOTENV_VAULT_PRODUCTION
  if (!ciphertext) {
    const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`)
    err.code = 'NOT_FOUND_DOTENV_ENVIRONMENT'
    throw err
  }

  return { ciphertext, key }
}

function _vaultPath (options) {
  let possibleVaultPath = null

  if (options && options.path && options.path.length > 0) {
    if (Array.isArray(options.path)) {
      for (const filepath of options.path) {
        if (fs.existsSync(filepath)) {
          possibleVaultPath = filepath.endsWith('.vault') ? filepath : `${filepath}.vault`
        }
      }
    } else {
      possibleVaultPath = options.path.endsWith('.vault') ? options.path : `${options.path}.vault`
    }
  } else {
    possibleVaultPath = path.resolve(process.cwd(), '.env.vault')
  }

  if (fs.existsSync(possibleVaultPath)) {
    return possibleVaultPath
  }

  return null
}

function _resolveHome (envPath) {
  return envPath[0] === '~' ? path.join(os.homedir(), envPath.slice(1)) : envPath
}

function _configVault (options) {
  const debug = parseBoolean(process.env.DOTENV_CONFIG_DEBUG || (options && options.debug))
  const quiet = parseBoolean(process.env.DOTENV_CONFIG_QUIET || (options && options.quiet))

  if (debug || !quiet) {
    _log('loading env from encrypted .env.vault')
  }

  const parsed = DotenvModule._parseVault(options)

  let processEnv = process.env
  if (options && options.processEnv != null) {
    processEnv = options.processEnv
  }

  DotenvModule.populate(processEnv, parsed, options)

  return { parsed }
}

function configDotenv (options) {
  const dotenvPath = path.resolve(process.cwd(), '.env')
  let encoding = 'utf8'
  let processEnv = process.env
  if (options && options.processEnv != null) {
    processEnv = options.processEnv
  }
  let debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || (options && options.debug))
  let quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || (options && options.quiet))

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

  const populated = DotenvModule.populate(processEnv, parsedAll, options)

  // handle user settings DOTENV_CONFIG_ options inside .env file(s)
  debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || debug)
  quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || quiet)

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

    _log(`injected env (${keysCount}) from ${shortPaths.join(',')} ${dim(`// tip: ${_getRandomTip()}`)}`)
  }

  if (lastError) {
    return { parsed: parsedAll, error: lastError }
  } else {
    return { parsed: parsedAll }
  }
}

// Populates process.env from .env file
function config (options) {
  // fallback to original dotenv if DOTENV_KEY is not set
  if (_dotenvKey(options).length === 0) {
    return DotenvModule.configDotenv(options)
  }

  const vaultPath = _vaultPath(options)

  // dotenvKey exists but .env.vault file does not exist
  if (!vaultPath) {
    _warn(`you set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}`)

    return DotenvModule.configDotenv(options)
  }

  return DotenvModule._configVault(options)
}

function decrypt (encrypted, keyStr) {
  const key = Buffer.from(keyStr.slice(-64), 'hex')
  let ciphertext = Buffer.from(encrypted, 'base64')

  const nonce = ciphertext.subarray(0, 12)
  const authTag = ciphertext.subarray(-16)
  ciphertext = ciphertext.subarray(12, -16)

  try {
    const aesgcm = crypto.createDecipheriv('aes-256-gcm', key, nonce)
    aesgcm.setAuthTag(authTag)
    return `${aesgcm.update(ciphertext)}${aesgcm.final()}`
  } catch (error) {
    const isRange = error instanceof RangeError
    const invalidKeyLength = error.message === 'Invalid key length'
    const decryptionFailed = error.message === 'Unsupported state or unable to authenticate data'

    if (isRange || invalidKeyLength) {
      const err = new Error('INVALID_DOTENV_KEY: It must be 64 characters long (or more)')
      err.code = 'INVALID_DOTENV_KEY'
      throw err
    } else if (decryptionFailed) {
      const err = new Error('DECRYPTION_FAILED: Please check your DOTENV_KEY')
      err.code = 'DECRYPTION_FAILED'
      throw err
    } else {
      throw error
    }
  }
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
  _configVault,
  _parseVault,
  config,
  decrypt,
  parse,
  populate
}

module.exports.configDotenv = DotenvModule.configDotenv
module.exports._configVault = DotenvModule._configVault
module.exports._parseVault = DotenvModule._parseVault
module.exports.config = DotenvModule.config
module.exports.decrypt = DotenvModule.decrypt
module.exports.parse = DotenvModule.parse
module.exports.populate = DotenvModule.populate

module.exports = DotenvModule
