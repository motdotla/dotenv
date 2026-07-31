#!/usr/bin/env node

const fs = require('fs')
const os = require('os')
const path = require('path')
const cp = require('child_process')

const dotenv = require('./lib/main')

function parseBoolean (value) {
  if (typeof value === 'string') {
    return !['false', '0', 'no', 'off', ''].includes(value.toLowerCase())
  }
  return Boolean(value)
}

function printHelp () {
  console.log([
    'Usage: dotenv run [--help] [--quiet] [--debug] [--override] [-f <path>] -- <command>',
    '',
    'Run a command with environment variables from a .env file.',
    '',
    'Options:',
    '  -f <path>   path to your .env file (default: .env)',
    '  --quiet     suppress the injected env message',
    '  --debug     enable debug logging',
    '  --override  override existing environment variables',
    '',
    'Environment variables (same as former preload):',
    '  DOTENV_CONFIG_PATH, DOTENV_CONFIG_ENCODING, DOTENV_CONFIG_QUIET,',
    '  DOTENV_CONFIG_DEBUG, DOTENV_CONFIG_OVERRIDE'
  ].join('\n'))
}

function parseRunArgs (args) {
  const paths = []
  let pathSet = false
  let quiet
  let debug
  let override
  let commandIndex = -1

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--') {
      commandIndex = i + 1
      break
    }

    if (arg === '--help' || arg === '-h') {
      return { help: true }
    }

    if (arg === '--quiet') {
      quiet = true
      continue
    }

    if (arg === '--debug') {
      debug = true
      continue
    }

    if (arg === '--override') {
      override = true
      continue
    }

    if (arg === '-f') {
      const filepath = args[i + 1]
      if (!filepath || filepath === '--') {
        return { error: '-f requires a path' }
      }

      paths.push(filepath)
      pathSet = true
      i++
      continue
    }

    if (arg.startsWith('-f=')) {
      const filepath = arg.slice(3)
      if (!filepath) {
        return { error: '-f requires a path' }
      }

      paths.push(filepath)
      pathSet = true
      continue
    }

    return { error: `unknown option: ${arg}` }
  }

  const command = commandIndex === -1 ? [] : args.slice(commandIndex)
  return {
    paths,
    pathSet,
    quiet,
    debug,
    override,
    command
  }
}

function resolveHome (envPath) {
  return envPath[0] === '~' ? path.join(os.homedir(), envPath.slice(1)) : envPath
}

function optionsFromEnv () {
  const options = {}

  if (process.env.DOTENV_CONFIG_ENCODING != null) {
    options.encoding = process.env.DOTENV_CONFIG_ENCODING
  }
  if (process.env.DOTENV_CONFIG_PATH != null) {
    options.path = process.env.DOTENV_CONFIG_PATH
  }
  if (process.env.DOTENV_CONFIG_QUIET != null) {
    options.quiet = parseBoolean(process.env.DOTENV_CONFIG_QUIET)
  }
  if (process.env.DOTENV_CONFIG_DEBUG != null) {
    options.debug = parseBoolean(process.env.DOTENV_CONFIG_DEBUG)
  }
  if (process.env.DOTENV_CONFIG_OVERRIDE != null) {
    options.override = parseBoolean(process.env.DOTENV_CONFIG_OVERRIDE)
  }

  return options
}

function resolveRunOptions (parsed) {
  const envOptions = optionsFromEnv()
  const options = {
    encoding: envOptions.encoding || 'utf8',
    quiet: envOptions.quiet === true,
    debug: envOptions.debug === true,
    override: envOptions.override === true,
    paths: ['.env'],
    defaultPath: true
  }

  if (envOptions.path != null) {
    options.paths = [envOptions.path]
    options.defaultPath = false
  }

  if (parsed.pathSet) {
    options.paths = parsed.paths
    options.defaultPath = false
  }
  if (parsed.quiet != null) options.quiet = parsed.quiet
  if (parsed.debug != null) options.debug = parsed.debug
  if (parsed.override != null) options.override = parsed.override

  return options
}

function loadEnvFiles (options) {
  const parsedAll = {}
  const loadedPaths = []
  const populateOptions = {
    override: options.override,
    debug: options.debug
  }

  for (const filepath of options.paths) {
    const resolvedPath = path.resolve(process.cwd(), resolveHome(filepath))
    try {
      const parsed = dotenv.parse(fs.readFileSync(resolvedPath, { encoding: options.encoding }))
      dotenv.populate(parsedAll, parsed, populateOptions)
      loadedPaths.push(filepath)
    } catch (e) {
      if (options.debug) {
        console.log(`┆ failed to load ${filepath} ${e.message}`)
      }
      if (!(options.defaultPath && e.code === 'ENOENT')) {
        throw e
      }
    }
  }

  const injected = dotenv.populate(process.env, parsedAll, populateOptions)
  return { injected, loadedPaths }
}

function run (argv) {
  const command = argv[0]

  if (command === '--help' || command === '-h') {
    printHelp()
    return
  }

  if (command !== 'run') {
    printHelp()
    process.exitCode = 1
    return
  }

  const parsed = parseRunArgs(argv.slice(1))
  if (parsed.help) {
    printHelp()
    return
  }

  if (parsed.error) {
    console.error(`dotenv: ${parsed.error}`)
    printHelp()
    process.exitCode = 1
    return
  }

  if (parsed.command.length === 0) {
    printHelp()
    process.exitCode = 1
    return
  }

  const options = resolveRunOptions(parsed)

  try {
    const result = loadEnvFiles(options)
    if (!options.quiet) {
      let message = `◇ injected env (${Object.keys(result.injected).length})`
      if (result.loadedPaths.length > 0) {
        message += ` from ${result.loadedPaths.join(', ')}`
      }
      console.error(message)
    }
  } catch (e) {
    console.error(`dotenv: ${e.message}`)
    process.exitCode = 1
    return
  }

  const child = cp.spawn(parsed.command[0], parsed.command.slice(1), {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  })

  child.on('error', function (e) {
    console.error(`dotenv: ${e.message}`)
    process.exitCode = 1
  })

  child.on('exit', function (exitCode, signal) {
    if (typeof exitCode === 'number') {
      process.exit(exitCode)
    } else {
      process.kill(process.pid, signal)
    }
  })
}

module.exports = run

if (require.main === module) {
  run(process.argv.slice(2))
}
