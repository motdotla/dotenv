const dotenv = require('./lib/main')

// Keep side-effect imports quiet unless logging is explicitly requested.
const quiet = process.env.DOTENV_QUIET != null
  ? process.env.DOTENV_QUIET
  : process.env.DOTENV_CONFIG_QUIET

dotenv.config({ quiet: quiet != null ? quiet : true })
