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
    'Usage: dotenv run [--help] [--quiet] [--debug] [--override] [--secure] [--fast] [-f <path>] -- <command>',
    '',
    'Run a command with environment variables from a .env file.',
    '',
    'Options:',
    '  -f <path>   path to your .env file (default: .env)',
    '  --quiet     suppress the injected env message',
    '  --debug     enable debug logging',
    '  --override  override existing environment variables',
    '  --secure    decrypt via dotenvx (requires dotenvx)',
    '  --fast      use the faster character-scanner parser',
    '',
    'Environment variables (same as former preload):',
    '  DOTENV_CONFIG_PATH, DOTENV_CONFIG_ENCODING, DOTENV_CONFIG_QUIET,',
    '  DOTENV_CONFIG_DEBUG, DOTENV_CONFIG_OVERRIDE, DOTENV_CONFIG_SECURE,',
    '  DOTENV_CONFIG_FAST'
  ].join('\n'))
}

function parseRunArgs (args) {
  const paths = []
  let pathSet = false
  let quiet
  let debug
  let override
  let secure
  let fast
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

    if (arg === '--secure') {
      secure = true
      continue
    }

    if (arg === '--fast') {
      fast = true
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
    secure,
    fast,
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
  if (process.env.DOTENV_CONFIG_SECURE != null) {
    options.secure = parseBoolean(process.env.DOTENV_CONFIG_SECURE)
  }
  if (process.env.DOTENV_CONFIG_FAST != null) {
    options.fast = parseBoolean(process.env.DOTENV_CONFIG_FAST)
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
    secure: envOptions.secure === true,
    fast: envOptions.fast === true,
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
  if (parsed.secure != null) options.secure = parsed.secure
  if (parsed.fast != null) options.fast = parsed.fast

  return options
}

function resolveDotenvx () {
  try {
    const pkgPath = require.resolve('@dotenvx/dotenvx/package.json', { paths: [process.cwd()] })
    const pkg = JSON.parse(fs.readFileSync(pkgPath, { encoding: 'utf8' }))
    const bin = typeof pkg.bin === 'string' ? pkg.bin : (pkg.bin && pkg.bin.dotenvx)
    if (bin) {
      return {
        command: process.execPath,
        args: [path.resolve(path.dirname(pkgPath), bin)]
      }
    }
  } catch (_) {}

  const which = process.platform === 'win32' ? 'where' : 'which'
  const result = cp.spawnSync(which, ['dotenvx'], { encoding: 'utf8' })
  if (result.status === 0) {
    const binPath = result.stdout.split(/\r?\n/).filter(Boolean)[0]
    if (binPath) {
      return {
        command: binPath,
        args: []
      }
    }
  }

  return null
}

function buildDotenvxArgs (options, command) {
  const args = ['run']

  for (const filepath of options.paths) {
    args.push('-f', filepath)
  }
  if (options.quiet) args.push('--quiet')
  if (options.debug) args.push('--debug')
  if (options.override) args.push('--overload')
  args.push('--')
  for (const part of command) {
    args.push(part)
  }

  return args
}

function printSecureMissingError () {
  console.error('dotenv: --secure requires dotenvx')
  console.error('  npm i @dotenvx/dotenvx')
  console.error('  # or: curl -sfS https://dotenvx.sh | sh')
}

function runSecure (options, command) {
  const resolved = resolveDotenvx()
  if (!resolved) {
    printSecureMissingError()
    process.exitCode = 1
    return
  }

  const child = cp.spawn(resolved.command, resolved.args.concat(buildDotenvxArgs(options, command)), {
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

function hasEncryptedValues (parsed) {
  for (const key of Object.keys(parsed)) {
    const value = parsed[key]
    if (typeof value === 'string' && value.indexOf('encrypted:') === 0) {
      return true
    }
  }
  return false
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
      const parsed = dotenv.parse(fs.readFileSync(resolvedPath, { encoding: options.encoding }), { fast: options.fast })
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

  const encrypted = hasEncryptedValues(parsedAll)
  const injected = dotenv.populate(process.env, parsedAll, populateOptions)
  return { injected, loadedPaths, encrypted }
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

  if (options.secure) {
    runSecure(options, parsed.command)
    return
  }

  try {
    const result = loadEnvFiles(options)
    if (!options.quiet) {
      let message = `◇ injected env (${Object.keys(result.injected).length})`
      if (result.loadedPaths.length > 0) {
        message += ` from ${result.loadedPaths.join(', ')}`
      }
      console.error(message)
    }
    if (result.encrypted) {
      console.error('┆ encrypted values detected — use: dotenv run --secure -- <command>')
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
