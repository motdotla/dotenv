function parseBoolean (value) {
  if (typeof value === 'string') {
    return !['false', '0', 'no', 'off', ''].includes(value.toLowerCase())
  }
  return Boolean(value)
}

function optionsFromEnv () {
  const options = {}

  for (const name of ['ENCODING', 'PATH', 'QUIET', 'DEBUG', 'OVERRIDE', 'FAST']) {
    const value = process.env[`DOTENV_${name}`] != null
      ? process.env[`DOTENV_${name}`]
      : process.env[`DOTENV_CONFIG_${name}`]

    if (value != null) {
      options[name.toLowerCase()] = name === 'ENCODING' || name === 'PATH' ? value : parseBoolean(value)
    }
  }

  return options
}

module.exports = { parseBoolean, optionsFromEnv }
