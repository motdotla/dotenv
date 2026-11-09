const dotenv = require('./lib/main')

module.exports = dotenv
// Keep explicit assignments so Node can detect named exports in the CJS bundle.
module.exports.config = dotenv.config
module.exports.configDotenv = dotenv.configDotenv
module.exports.parse = dotenv.parse
module.exports.populate = dotenv.populate
