/* @flow */

// ../config.js accepts options via environment variables
const options = {}

if (process.env.DOTENV_CONFIG_ENCODING != null) {
  options.encoding = process.env.DOTENV_CONFIG_ENCODING
}

if (process.env.DOTENV_CONFIG_PATH != null) {
  options.path = process.env.DOTENV_CONFIG_PATH
}

if (process.env.DOTENV_CONFIG_DEBUG != null) {
  options.debug = process.env.DOTENV_CONFIG_DEBUG
}

if (process.env.DOTENV_CONFIG_EXAMPLE_PATH != null) {
  options.examplePath = process.env.DOTENV_CONFIG_EXAMPLE_PATH
}

if (process.env.DOTENV_CONFIG_DEFAULT_PATH != null) {
  options.defaultPath = process.env.DOTENV_CONFIG_DEFAULT_PATH
}

if (process.env.DOTENV_CONFIG_EXTENDED != null) {
  options.extended = process.env.DOTENV_CONFIG_EXTENDED
}

module.exports = options
