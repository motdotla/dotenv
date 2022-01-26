const LINE = /(?:^|\A)\s*(?:export\s+)?([\w\.]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|[^\#\r\n]+)?\s*(?:\#.*)?(?:$|\z)/mg // eslint-disable-line

// Parser src into an Object
function parse (src) {
  const obj = {}

  // Convert buffer to string
  let lines = src.toString()

  // Convert line breaks to same format
  lines = lines.replace(/\r\n?/, '\n')

  let match
  while ((match = LINE.exec(lines)) != null) {
    const key = match[1]

    // Default undefined or null to empty string
    let value = (match[2] || '')

    value = _parseValue(value)

    obj[key] = value
  }

  return obj
}

function _parseValue (value) {
  // Remove whitespace
  value = value.trim()

  // Check if double quoted
  const maybeQuote = value[0]

  // Remove surrounding quotes
  value = value.replace(/^(['"])(.*)\1$/m, '$2')

  // Expand newlines if double quoted
  if (maybeQuote === '"') {
    value = value.replace(/\\n/g, '\n')
    value = value.replace(/\\r/g, '\r')
  }

  return value
}

module.exports.parse = parse
