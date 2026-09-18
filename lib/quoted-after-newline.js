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
    if (cc === 32 || cc === 9) { i++; continue }
    if (cc === 35 /* # */) {
      while (i < len && str.charCodeAt(i) !== 10) i++
      break
    }
    if (cc === 10) break
    // junk found -> whole alternative dies
    return ['', i]
  }

  if (quote === 34 && value.indexOf('\\') !== -1) {
    value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r')
  }
  return [value, i]
}

module.exports = { parseQuotedAfterNewline }
