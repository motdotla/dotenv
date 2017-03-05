#!/usr/bin/env node

require('../lib/main').config();
require('../lib/cli')(process.argv.slice(2))
