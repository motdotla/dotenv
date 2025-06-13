require('../../../../lib/main').config({ strategy: 'nearest' })
module.exports = function getEnv () {
  return process.env.TEST_KEY
}
