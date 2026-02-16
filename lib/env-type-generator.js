const fs = require('fs')
const path = require('path')
const DotenvModule = require('./main')

const DEFAULT_ENV_FILENAME = '.env'
const DEFAULT_OUTPUT_FILENAME = 'env.d.ts'

function generate (options) {
  const envPath = options?.path || path.resolve(process.cwd(), DEFAULT_ENV_FILENAME)
  const outputPath = options?.output || path.resolve(process.cwd(), DEFAULT_OUTPUT_FILENAME)

  if (!fs.existsSync(envPath)) {
    throw new Error(`File not found: ${envPath}`)
  }

  const parsed = DotenvModule.parse(fs.readFileSync(envPath))
  const keys = Object.keys(parsed)

  const content = `declare global {
  namespace NodeJS {
    interface ProcessEnv {
${keys.map(key => `      ${key}: string;`).join('\n')}
    }
  }
}

export {}
`

  fs.writeFileSync(outputPath, content)
  return content
}

module.exports = generate
