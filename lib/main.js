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

// Expand \n and \r escape sequences in double-quoted values.
function expandDoubleQuoteEscapes (value) {
  return value.replace(/\\n/g, '\n').replace(/\\r/g, '\r')
}

// Helper for parseFast: handle a quoted value that begins after the separator
// crossed at least one newline. Mirrors the default regex's behavior:
// - the quoted alternative may span newlines
// - junk after its closing quote (same line) kills the whole alternative
//   because the raw fallback cannot cross newlines -> value ''
// - an unterminated quote also kills it -> value ''
// Returns [value, nextIndex].
function parseQuotedAfterNewline (str, start, len) {
  const quote = str.charCodeAt(start)
  const vStart = start + 1
  let j = vStart
  while (j < len) {
    const cc = str.charCodeAt(j)
    if (cc === 92 /* \ */ && j + 1 < len) {
      const nc = str.charCodeAt(j + 1)
      if (nc === quote || nc === 92) {
        j += 2
        continue
      }
    }
    if (cc === quote) break
    j++
  }

  // unterminated -> alternative dies, value ''
  if (j >= len) return ['', len]

  let value = str.slice(vStart, j)
  let i = j + 1

  // junk (non-ws, non-comment) on the closing-quote's line kills it
  while (i < len) {
    const cc = str.charCodeAt(i)
    if (cc === 32 || cc === 9 || cc === 11 || cc === 12 || cc === 160) { i++; continue }
    if (cc === 35 /* # */) {
      while (i < len && str.charCodeAt(i) !== 10) i++
      break
    }
    if (cc === 10) break
    // junk found -> whole alternative dies
    return ['', i]
  }

  if (quote === 34 && value.indexOf('\\') !== -1) {
    value = expandDoubleQuoteEscapes(value)
  }
  return [value, i]
}

// Parse src into an Object — hand-written character scanner (no regex in hot path)
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

    // skip whitespace / blank lines (\r already normalized out)
    // 65279 is a BOM (U+FEFF), which editors on Windows write ahead of the
    // first key — the classic parser skips it as part of \s*, so do the same
    while (i < len && (c === 32 || c === 9 || c === 10 || c === 65279 || c === 12 || c === 11 || c === 160)) {
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
      if (nc === 32 || nc === 9 || nc === 11 || nc === 12 || nc === 160) {
        i += 7
        while (i < len && ((c = str.charCodeAt(i)) === 32 || c === 9 || c === 11 || c === 12 || c === 160)) i++
      } else {
        c = str.charCodeAt(i)
      }
    }

    // key: [A-Za-z0-9_.-]+ via lookup
    const keyStart = i
    let stop = 0
    let afterSeparator = ''
    let sawSpaceBeforeSeparator = false
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
    if (stop === 32 || stop === 9 || stop === 11 || stop === 12 || stop === 160) {
      sawSpaceBeforeSeparator = true
      do { i++; stop = i < len ? str.charCodeAt(i) : 0 } while (stop === 32 || stop === 9 || stop === 11 || stop === 12 || stop === 160)
    }

    if (stop === 61 /* = */) {
      i++
      afterSeparator = '='
    } else if (stop === 58 /* : */ && !sawSpaceBeforeSeparator && i + 1 < len && (str.charCodeAt(i + 1) === 32 || str.charCodeAt(i + 1) === 9 || str.charCodeAt(i + 1) === 11 || str.charCodeAt(i + 1) === 12 || str.charCodeAt(i + 1) === 160)) {
      i++
      afterSeparator = ': '
    } else {
      // invalid line — skip
      while (i < len && str.charCodeAt(i) !== 10) i++
      continue
    }

    // skip spaces/tabs after separator
    while (i < len && ((c = str.charCodeAt(i)) === 32 || c === 9 || c === 11 || c === 12 || c === 160)) i++

    // With a ':' separator the default regex requires exactly ':' + \s+? and
    // the raw alternative starts right after the FIRST space: 'A:  x' keeps
    // ' x' (one leading space), 'A : x' does not match at all (space before
    // ':' is invalid), and quoted values stay verbatim ('A: "q"' -> '"q"').
    if (afterSeparator === ': ') {
      // re-insert exactly one of the consumed spaces
      if (i > 0 && (str.charCodeAt(i - 1) === 32 || str.charCodeAt(i - 1) === 9 || str.charCodeAt(i - 1) === 11 || str.charCodeAt(i - 1) === 12 || str.charCodeAt(i - 1) === 160)) i--
    }

    // The default parser's quoted-value alternative carries a greedy leading
    // \s* that may cross newlines: after `A=` the value's opening quote may
    // live on a later line (past blank lines). Detect whether we crossed a
    // newline to reach the first non-blank char; if so, the quoted form is
    // allowed to span lines, but any junk after its closing quote on that
    // line kills the alternative entirely (the raw fallback cannot cross
    // newlines) and the value ends up empty.
    let crossedNewline = false
    {
      let scan = i
      while (scan < len) {
        const sc = str.charCodeAt(scan)
        if (sc === 32 || sc === 9 || sc === 10 || sc === 65279 || sc === 12 || sc === 11 || sc === 160) {
          if (sc === 10) crossedNewline = true
          scan++
          continue
        }
        break
      }
      if (crossedNewline) {
        // A newline was crossed after the separator. Mirror the regex engine:
        // the quoted alternative may start here (spanning lines), but its raw
        // fallback cannot cross newlines, so any junk after the closing quote
        // on that line kills the quoted form AND leaves EMPTY's value ''.
        // Crucially the regex then retries a fresh match at that later line —
        // so resume scanning AT scan, not at end-of-line.
        c = scan < len ? str.charCodeAt(scan) : 0
        if (c === 39 || c === 34 || c === 96) {
          i = scan
          const [qValue, next] = parseQuotedAfterNewline(str, i, len)
          obj[key] = qValue
          i = next
          continue
        }
        // non-quote after the jump: EMPTY stays '', and the text at scan is
        // re-parsed from scratch as its own entry (the regex retries ^ there).
        obj[key] = ''
        i = scan
        continue
      }
    }

    let value
    let quotedOk = true
    c = i < len ? str.charCodeAt(i) : 0

    if (c === 39 /* ' */ || c === 34 /* " */ || c === 96 /* ` */) {
      const quote = c
      const vStart = i + 1
      let j = vStart
      while (j < len) {
        const cc = str.charCodeAt(j)
        // a backslash consumes the next character when it escapes the quote (\") or
        // another backslash (\\). Without the \\ case the second backslash of a pair
        // is left free to escape a following closing quote, so a value ending in an
        // escaped backslash — VAR="C:\\dir\\" — runs past its own closing quote and
        // swallows the rest of the file.
        if (cc === 92 /* \ */ && j + 1 < len) {
          const nc = str.charCodeAt(j + 1)
          if (nc === quote || nc === 92 /* \ */) {
            j += 2
            continue
          }
        }
        if (cc === quote) {
          break
        }
        j++
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
          if (cc === 32 || cc === 9 || cc === 11 || cc === 12 || cc === 160) end--
          else break
        }
        value = str.slice(uStart, end)
        i = k
        if (i < len && str.charCodeAt(i) === 35) {
          while (i < len && str.charCodeAt(i) !== 10) i++
        }
      } else {
        // A quoted alternative only survives when nothing but spaces/tabs (or
        // a comment) follows its closing quote. Any other trailing junk on
        // the same line kills the quoted form and the raw single-line
        // alternative takes over, starting at the opening quote.
        let k = j + 1
        while (k < len) {
          const cc = str.charCodeAt(k)
          if (cc === 32 || cc === 9 || cc === 11 || cc === 12 || cc === 160) { k++; continue }
          if (cc === 35 /* # */ || cc === 10) break
          // junk found — fall back to raw single-line starting at the quote
          const rStart = i
          let rEnd = rStart
          while (rEnd < len) {
            const rc = str.charCodeAt(rEnd)
            if (rc === 35 || rc === 10) break
            rEnd++
          }
          value = str.slice(rStart, rEnd)
          i = rEnd
          quotedOk = false
          break
        }
        if (quotedOk) {
          value = str.slice(vStart, j)
          i = k
          if (quote === 34 && value.indexOf('\\') !== -1) {
            value = expandDoubleQuoteEscapes(value)
          }
          if (i < len && str.charCodeAt(i) === 35) {
            while (i < len && str.charCodeAt(i) !== 10) i++
          }
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
        if (cc === 32 || cc === 9 || cc === 11 || cc === 12 || cc === 160) end--
        else break
      }
      value = vStart === end ? '' : str.slice(vStart, end).trim()
      // The default parser trims the captured value, strips surrounding
      // quotes and expands escapes for double-quoted values. Mirror that
      // for values whose trimmed form is wrapped in matching quotes.
      const trimmed = value.trim()
      if (trimmed.length >= 2) {
        const first = trimmed.charCodeAt(0)
        const last = trimmed.charCodeAt(trimmed.length - 1)
        if ((first === 39 && last === 39) || (first === 34 && last === 34) || (first === 96 && last === 96)) {
          const inner = trimmed.slice(1, -1)
          value = first === 34 && inner.indexOf('\\') !== -1
            ? expandDoubleQuoteEscapes(inner)
            : inner
        }
      }
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
