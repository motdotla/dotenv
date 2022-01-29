// ../config.js accepts options via environment variables
const options = {}

if (process.env.DOTENV_CONFIG_ENCODING) {
  options.encoding = process.env.DOTENV_CONFIG_ENCODING
}

if (process.env.DOTENV_CONFIG_PATH) {
  options.path = process.env.DOTENV_CONFIG_PATH
}

if (process.env.DOTENV_CONFIG_DEBUG) {
  options.debug = process.env.DOTENV_CONFIG_DEBUG
}

if (process.env.DOTENV_CONFIG_OVERRIDE) {
  options.override = process.env.DOTENV_CONFIG_OVERRIDE
}

if (process.env.DOTENV_CONFIG_MULTILINE) {
  options.multiline = process.env.DOTENV_CONFIG_MULTILINE
}

module.exports = options
