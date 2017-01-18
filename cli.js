#!/usr/bin/env node

var spawn = require('child_process').spawn
var dotenv = require('dotenv')

dotenv.load({path: process.cwd() + '/.env'})

spawn(process.argv[2], process.argv.slice(3), {stdio: 'inherit'})
