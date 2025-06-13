require('../../../../lib/main').config()
module.exports = function getEnv () {
  return process.env.TEST_KEY
}
