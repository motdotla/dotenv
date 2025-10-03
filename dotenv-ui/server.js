/* server.js
   Minimal Express server exposing a small API to read/write/diff .env files
   and to call dotenvx (if available). Intended for local development only.
*/

// Add parent node_modules to module path
const path = require('path')
const modulePaths = [
  path.join(__dirname, 'node_modules'),
  path.join(__dirname, '..', 'node_modules')
]

// Temporarily modify NODE_PATH to include parent node_modules
const originalNodePath = process.env.NODE_PATH || ''
process.env.NODE_PATH = modulePaths.join(':') + ':' + originalNodePath
require('module').Module._initPaths()

const express = require('express')
const fs = require('fs')
const { parse } = require('dotenv') // This uses the parent dotenv package!
const bodyParser = require('body-parser')
const { exec } = require('child_process')

const app = express()
const PORT = process.env.PORT || 3000

// Security middleware
app.use(bodyParser.json({ limit: '1mb' }))
app.use(express.static(path.join(__dirname, 'public')))

// Configurable file paths - relative to the dotenv-ui folder
const ENV_FILE = path.join(__dirname, '.env')
const EXAMPLE_FILE = path.join(__dirname, '.env.example')

function readEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`)
      return {}
    }
    const content = fs.readFileSync(filePath, { encoding: 'utf8' })
    return parse(content)
  } catch (err) {
    console.error('readEnvFile error', err)
    return {}
  }
}

function writeEnvFile(filePath, obj) {
  try {
    // Validate input
    if (typeof obj !== 'object' || obj === null) {
      throw new Error('Invalid environment object')
    }

    const lines = []
    for (const key of Object.keys(obj)) {
      // Basic key validation
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
        console.warn(`Skipping invalid key: ${key}`)
        continue
      }
      
      const val = obj[key] == null ? '' : String(obj[key])
      // Quote a value containing spaces or # or newlines
      const needsQuotes = /\s|#|\n/.test(val)
      const escaped = needsQuotes ? JSON.stringify(val) : val
      lines.push(`${key}=${escaped}`)
    }
    
    // Ensure directory exists
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    fs.writeFileSync(filePath, lines.join('\n') + '\n', { encoding: 'utf8' })
    return true
  } catch (err) {
    console.error('writeEnvFile error:', err)
    throw err
  }
}

// GET current .env as JSON
app.get('/api/env', (req, res) => {
  try {
    const env = readEnvFile(ENV_FILE)
    res.json({ env })
  } catch (err) {
    console.error('GET /api/env error:', err)
    res.status(500).json({ error: 'Failed to read .env file' })
  }
})

// GET example file
app.get('/api/env-example', (req, res) => {
  try {
    const example = readEnvFile(EXAMPLE_FILE)
    res.json({ example })
  } catch (err) {
    console.error('GET /api/env-example error:', err)
    res.status(500).json({ error: 'Failed to read .env.example file' })
  }
})

// POST write .env (body: { env: {KEY: VALUE} })
app.post('/api/env', (req, res) => {
  try {
    const { env } = req.body || {}
    if (!env || typeof env !== 'object') {
      return res.status(400).json({ error: 'Missing or invalid env object' })
    }

    // Additional validation
    if (Object.keys(env).length === 0) {
      return res.status(400).json({ error: 'Empty environment object' })
    }

    writeEnvFile(ENV_FILE, env)
    res.json({ ok: true })
  } catch (err) {
    console.error('POST /api/env error:', err)
    res.status(500).json({ error: String(err) })
  }
})

// GET diff between .env and .env.example
app.get('/api/diff', (req, res) => {
  try {
    const env = readEnvFile(ENV_FILE)
    const example = readEnvFile(EXAMPLE_FILE)

    const envKeys = new Set(Object.keys(env))
    const exampleKeys = new Set(Object.keys(example))

    const missing = []
    const extra = []
    const common = []

    for (const k of exampleKeys) if (!envKeys.has(k)) missing.push(k)
    for (const k of envKeys) if (!exampleKeys.has(k)) extra.push(k)
    for (const k of envKeys) if (exampleKeys.has(k)) common.push(k)

    res.json({ missing, extra, common })
  } catch (err) {
    console.error('GET /api/diff error:', err)
    res.status(500).json({ error: 'Failed to compute diff' })
  }
})

// POST encrypt: Runs a user-defined dotenvx command if present.
app.post('/api/encrypt', (req, res) => {
  let cmd = process.env.DOTENVX_CMD
  
  // If no custom command, try different patterns
  if (!cmd) {
    // Try common dotenvx command patterns
    const possibleCommands = [
      'dotenvx encrypt .env',
      'dotenvx encrypt -f .env',
      'dotenvx encrypt --file .env',
      'dotenvx encrypt .env -o .env.enc',
      'dotenvx encrypt .env > .env.enc'
    ]
    cmd = possibleCommands[0] // Start with the simplest
  }
  
  // Check if .env exists
  if (!fs.existsSync(ENV_FILE)) {
    return res.status(400).json({ error: '.env file not found' })
  }

  console.log(`Executing: ${cmd}`)
  exec(cmd, { cwd: __dirname }, (err, stdout, stderr) => {
    if (err) {
      console.error('Encrypt error:', err)
      let errorMessage = String(err)
      
      if (err.code === 127) {
        errorMessage = 'dotenvx command not found. Please install dotenvx or configure DOTENVX_CMD environment variable.'
      } else if (stderr.includes('unknown option') || stderr.includes('Usage:')) {
        errorMessage = `Command failed: ${stderr || err.message}. Try setting DOTENVX_CMD environment variable with the correct syntax.`
      }
      
      return res.status(500).json({ 
        error: errorMessage,
        stderr: stderr || '',
        stdout: stdout || ''
      })
    }
    res.json({ ok: true, stdout, stderr })
  })
})

// POST decrypt: Runs user-defined command
app.post('/api/decrypt', (req, res) => {
  let cmd = process.env.DOTENVX_DECRYPT_CMD
  
  if (!cmd) {
    const possibleCommands = [
      'dotenvx decrypt .env.enc',
      'dotenvx decrypt -f .env.enc',
      'dotenvx decrypt --file .env.enc',
      'dotenvx decrypt .env.enc -o .env',
      'dotenvx decrypt .env.enc > .env'
    ]
    cmd = possibleCommands[0]
  }
  
  // Check if .env.enc exists
  const encFile = path.join(__dirname, '.env.enc')
  if (!fs.existsSync(encFile)) {
    return res.status(400).json({ error: '.env.enc file not found' })
  }

  console.log(`Executing: ${cmd}`)
  exec(cmd, { cwd: __dirname }, (err, stdout, stderr) => {
    if (err) {
      console.error('Decrypt error:', err)
      let errorMessage = String(err)
      
      if (err.code === 127) {
        errorMessage = 'dotenvx command not found. Please install dotenvx or configure DOTENVX_DECRYPT_CMD environment variable.'
      } else if (stderr.includes('unknown option') || stderr.includes('Usage:')) {
        errorMessage = `Command failed: ${stderr || err.message}. Try setting DOTENVX_DECRYPT_CMD environment variable with the correct syntax.`
      }
      
      return res.status(500).json({ 
        error: errorMessage,
        stderr: stderr || '',
        stdout: stdout || ''
      })
    }
    res.json({ ok: true, stdout, stderr })
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

app.listen(PORT, () => {
  console.log(`dotenv-ui running on http://localhost:${PORT}`)
})