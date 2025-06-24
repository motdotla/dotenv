const fs = require('fs')
const readline = require('readline')
const { performance } = require('perf_hooks')

/**
 * Performance-optimized parser for large .env files
 * Uses streaming approach to minimize memory usage
 * 
 * @class PerformantParser
 */
class PerformantParser {
  constructor(options = {}) {
    this.options = {
      maxLineLength: options.maxLineLength || 1024 * 1024, // 1MB per line max
      chunkSize: options.chunkSize || 64 * 1024, // 64KB chunks
      enableBenchmark: options.enableBenchmark || false,
      ...options
    }
    this.lineRegex = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/
  }

  /**
   * Stream-based parsing for large files
   * Memory efficient - processes line by line
   * 
   * @param {string} filePath - Path to .env file
   * @returns {Promise<Object>} Parsed environment variables
   */
  async parseFileStream(filePath) {
    const startTime = this.options.enableBenchmark ? performance.now() : 0
    
    return new Promise((resolve, reject) => {
      const result = {}
      const fileStream = fs.createReadStream(filePath, { 
        encoding: 'utf8',
        highWaterMark: this.options.chunkSize 
      })
      
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity // Handle Windows line endings
      })

      let lineCount = 0
      let errorOccurred = false

      rl.on('line', (line) => {
        try {
          lineCount++
          
          // Skip empty lines and comments
          if (!line.trim() || line.trim().startsWith('#')) {
            return
          }

          // Check line length to prevent memory issues
          if (line.length > this.options.maxLineLength) {
            throw new Error(`Line ${lineCount} exceeds maximum length of ${this.options.maxLineLength} characters`)
          }

          const parsed = this._parseLine(line)
          if (parsed) {
            result[parsed.key] = parsed.value
          }
        } catch (error) {
          errorOccurred = true
          rl.close()
          reject(new Error(`Parse error at line ${lineCount}: ${error.message}`))
        }
      })

      rl.on('close', () => {
        if (!errorOccurred) {
          if (this.options.enableBenchmark) {
            const endTime = performance.now()
            console.log(`[PERFORMANCE] Parsed ${lineCount} lines in ${(endTime - startTime).toFixed(2)}ms`)
          }
          resolve(result)
        }
      })

      rl.on('error', (error) => {
        reject(new Error(`File read error: ${error.message}`))
      })
    })
  }

  /**
   * Optimized synchronous parsing with chunked processing
   * Better performance for medium-sized files
   * 
   * @param {string|Buffer} src - Source content
   * @returns {Object} Parsed environment variables
   */
  parseOptimized(src) {
    const startTime = this.options.enableBenchmark ? performance.now() : 0
    
    // Convert buffer to string efficiently
    const content = typeof src === 'string' ? src : src.toString('utf8')
    
    // Pre-allocate result object with estimated size
    const estimatedLines = content.split('\n').length
    const result = Object.create(null) // Faster object creation
    
    // Use more efficient line splitting
    const lines = this._splitLines(content)
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Skip empty lines and comments quickly
      if (!line || line[0] === '#' || line.trim() === '') {
        continue
      }
      
      const parsed = this._parseLine(line)
      if (parsed) {
        result[parsed.key] = parsed.value
      }
    }

    if (this.options.enableBenchmark) {
      const endTime = performance.now()
      console.log(`[PERFORMANCE] Optimized parse completed in ${(endTime - startTime).toFixed(2)}ms`)
    }

    return result
  }

  /**
   * Memory-efficient line splitting
   * Avoids creating unnecessary intermediate arrays
   * 
   * @private
   * @param {string} content - Content to split
   * @returns {Array<string>} Array of lines
   */
  _splitLines(content) {
    // Normalize line endings for consistent processing
    const normalized = content.replace(/\r\n?/g, '\n')
    return normalized.split('\n')
  }

  /**
   * Parse a single line efficiently
   * Optimized regex matching and string operations
   * 
   * @private
   * @param {string} line - Line to parse
   * @returns {Object|null} Parsed key-value pair or null
   */
  _parseLine(line) {
    const match = this.lineRegex.exec(line)
    this.lineRegex.lastIndex = 0 // Reset regex state
    
    if (!match) {
      return null
    }

    const key = match[1]
    let value = match[2] || ''

    // Optimize string operations
    value = value.trim()

    if (!value) {
      return { key, value: '' }
    }

    // Handle quoted values efficiently
    const firstChar = value[0]
    const lastChar = value[value.length - 1]
    
    if ((firstChar === '"' && lastChar === '"') || 
        (firstChar === "'" && lastChar === "'") ||
        (firstChar === '`' && lastChar === '`')) {
      value = value.slice(1, -1)
      
      // Expand newlines only for double quotes
      if (firstChar === '"') {
        value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r')
      }
    }

    return { key, value }
  }

  /**
   * Benchmark comparison between different parsing methods
   * 
   * @param {string|Buffer} src - Source content to parse
   * @returns {Object} Benchmark results
   */
  benchmark(src) {
    const iterations = 100
    const results = {}

    // Benchmark original parsing
    const originalStart = performance.now()
    for (let i = 0; i < iterations; i++) {
      this._parseOriginal(src)
    }
    const originalEnd = performance.now()
    results.original = (originalEnd - originalStart) / iterations

    // Benchmark optimized parsing
    const optimizedStart = performance.now()
    for (let i = 0; i < iterations; i++) {
      this.parseOptimized(src)
    }
    const optimizedEnd = performance.now()
    results.optimized = (optimizedEnd - optimizedStart) / iterations

    results.improvement = ((results.original - results.optimized) / results.original * 100).toFixed(2)

    return results
  }

  /**
   * Original parsing method for comparison
   * @private
   */
  _parseOriginal(src) {
    const obj = {}
    let lines = src.toString()
    lines = lines.replace(/\r\n?/mg, '\n')

    const LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg
    
    let match
    while ((match = LINE.exec(lines)) != null) {
      const key = match[1]
      let value = (match[2] || '')
      value = value.trim()
      const maybeQuote = value[0]
      value = value.replace(/^(['"`])([\s\S]*)\1$/mg, '$2')
      
      if (maybeQuote === '"') {
        value = value.replace(/\\n/g, '\n')
        value = value.replace(/\\r/g, '\r')
      }
      
      obj[key] = value
    }
    
    return obj
  }
}

/**
 * Factory function to create performance-optimized parser
 * 
 * @param {Object} options - Parser options
 * @returns {PerformantParser} Parser instance
 */
function createPerformantParser(options = {}) {
  return new PerformantParser(options)
}

/**
 * High-level async parsing function for large files
 * 
 * @param {string} filePath - Path to .env file
 * @param {Object} options - Parsing options
 * @returns {Promise<Object>} Parsed environment variables
 */
async function parseFileAsync(filePath, options = {}) {
  const parser = new PerformantParser(options)
  
  try {
    // Check file size to determine parsing strategy
    const stats = await fs.promises.stat(filePath)
    const fileSizeKB = stats.size / 1024
    
    // Use streaming for files larger than 1MB
    if (fileSizeKB > 1024) {
      return await parser.parseFileStream(filePath)
    } else {
      // Use optimized sync parsing for smaller files
      const content = await fs.promises.readFile(filePath, 'utf8')
      return parser.parseOptimized(content)
    }
  } catch (error) {
    throw new Error(`Failed to parse file ${filePath}: ${error.message}`)
  }
}

module.exports = {
  PerformantParser,
  createPerformantParser,
  parseFileAsync
} 