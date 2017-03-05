'use strict'

var isWindows = require('is-windows')
var spawn = require('cross-spawn').spawn
var config = require('./main').config

var dotenvOptionsRegex = /--(\w+)=(.+)/ // --path=.env --encoding=utf-8
var envSetterRegex = /(\w+)=('(.+)'|"(.+)"|(.+))/ // foo=bar, foo="bar", foo='bar'
var envUseUnixRegex = /\$(\w+)/g // $my_var
var envUseWinRegex = /%(.*?)%/g // %my_var%

/**
 * Get next command, args, and env variables for child process
 * @param {Object} args - args provided by cli
 * @returns {array} command, args, and env variables
 */
function getCommandArgsAndEnvVars (args) {
  args = args || []
  var dotEnvOptions = getDotenvOptions(args)
  var envVars = getEnvVars(dotEnvOptions)
  var commandArgs = args.map(convertCommand)
  var command = getCommand(commandArgs, envVars)
  return [command, commandArgs, envVars]
}

/**
 * Get dotenv options defined in command args
 * Warn! Options extracted from args are deleted with mutation
 * eg: dotenv --path=.env --encoding=utf-8 ...
 * @returns {Object} options - options extracted from args
 */
function getDotenvOptions (args) {
  var dotenvOptions = {}

  if (Array.isArray(args)) {
    while (args.length) {
      if (dotenvOptionsRegex.test(args[0])) {
        var res = args.shift().substring(2).split('=')
        var key = res[0]
        var value = res[1]
        dotenvOptions[key] = value
        continue
      }
      break
    }
  }
  return dotenvOptions
}

/**
 * Get environment vars need to be forwarded
 * Merge process.env and variables loaded by dotenv
 * @param {Object} options - valid options: path ('.env'), encoding ('utf8')
 * @returns {Object} - env variables
 */
function getEnvVars (options) {
  var envVars = Object.assign(config(options).parsed || {}, process.env)
  if (process.env.APPDATA) {
    envVars.APPDATA = process.env.APPDATA
  }
  return envVars
}

/**
 * Converts an environment variable usage to be appropriate for the current OS
 * @param {String} variable - variable to convert
 * @returns {String} converted variable
 */
function convertCommand (variable) {
  var isWin = isWindows()
  var envExtract = isWin ? envUseUnixRegex : envUseWinRegex
  var match = envExtract.exec(variable)
  if (match) {
    variable = isWin ? `%${match[1]}%` : `$${match[1]}`
  }
  return variable
}

/**
 * Get future command from rest args
 * Check each command args step by step, set env variable if arg match
 * Warn! Env var extracted are deleted from command args with mutation
 * @param {array} commandArgs - command args provided by cli
 * @param {Object} envVars - environment variables need to be forwared
 * @return {string|null} command name if presents, otherwise null
 */
function getCommand (commandArgs, envVars) {
  if (Array.isArray(commandArgs)) {
    while (commandArgs.length) {
      var shifted = commandArgs.shift()
      var match = envSetterRegex.exec(shifted)
      if (!shifted.startsWith('--') && match) {
        if (envVars) {
          envVars[match[1]] = match[3] || match[4] || match[5]
        }
      } else {
        return shifted
      }
    }
  }
  return null
}

/**
 * Forward environment variables to the next process
 * Fetch environment variables processed by dotenv before call next command
 * @param {Object} args - command args provided by cli
 * @returns {ChildProcess|null} child process if another command need to be called, otherwhise null
 */
function forwardEnv (args) {
  var res = getCommandArgsAndEnvVars(args)
  var command = res[0]
  var commandArgs = res[1]
  var env = res[2]
  if (command) {
    var proc = spawn(command, commandArgs, {stdio: 'inherit', env})
    process.on('SIGTERM', () => proc.kill('SIGTERM'))
    process.on('SIGINT', () => proc.kill('SIGINT'))
    process.on('SIGBREAK', () => proc.kill('SIGBREAK'))
    process.on('SIGHUP', () => proc.kill('SIGHUP'))
    proc.on('exit', process.exit)
    return proc
  }
  return null
}

module.exports = forwardEnv
module.exports.getCommand = getCommand
module.exports.convertCommand = convertCommand
module.exports.getEnvVars = getEnvVars
module.exports.getDotenvOptions = getDotenvOptions
module.exports.getCommandArgsAndEnvVars = getCommandArgsAndEnvVars
