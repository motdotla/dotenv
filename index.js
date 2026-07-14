#!/usr/bin/env node

const dotenv = require('./lib/main')
const run = require('./cli')

module.exports = dotenv

if (require.main === module) {
  run(process.argv.slice(2))
}
