/* @flow */

module.exports = function (env = {}) {
  return Object.assign({},
    env.DOTENV_CONFIG_ENCODING ? { encoding: env.DOTENV_CONFIG_ENCODING } : null,
    env.DOTENV_CONFIG_PATH ? { path: env.DOTENV_CONFIG_PATH } : null,
    env.DOTENV_CONFIG_DEBUG ? { debug: env.DOTENV_CONFIG_DEBUG } : null
  )
}
