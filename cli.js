#!/usr/bin/env node

const fs = require('fs')
const os = require('os')
const path = require('path')
const cp = require('child_process')

const dotenv = require('./lib/main')

const { optionsFromEnv } = require('./lib/config-options')

function printHelp () {
  console.log([
    'Usage: dotenv run [--help] [-q|--quiet] [--debug] [--override] [--fast] [-f|--file <paths>] [--] <command> [args...]',
    '',
    'Run a command with environment variables from a .env file.',
    'Place dotenv options before the command; all following arguments go to the command.',
    '',
    'Options:',
    '  -f, --file <paths>  .env paths, comma-separated or repeated (default: .env)',
    '  -q, --quiet suppress the injected env message',
    '  --debug     enable debug logging',
    '  --override  override existing environment variables',
    '  --fast      use the faster character-scanner parser',
    '',
    'Environment variables (DOTENV_CONFIG_* names remain as fallbacks):',
    '  DOTENV_PATH, DOTENV_ENCODING, DOTENV_QUIET,',
    '  DOTENV_DEBUG, DOTENV_OVERRIDE,',
    '  DOTENV_FAST'
  ].join('\n'))
}

function parseRunArgs (args) {
  const paths = []
  let pathSet = false
  let quiet
  let debug
  let override
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

    if (arg === '--quiet' || arg === '-q') {
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

    if (arg === '--fast') {
      fast = true
      continue
    }

    if (arg === '-f' || arg === '--file' || arg.startsWith('-f=') || arg.startsWith('--file=')) {
      const equalsIndex = arg.indexOf('=')
      const flag = equalsIndex === -1 ? arg : arg.slice(0, equalsIndex)
      const value = equalsIndex === -1 ? args[++i] : arg.slice(equalsIndex + 1)
      if (!value || value === '--') {
        return { error: `${flag} requires a path` }
      }

      const filepaths = value.split(',').map(filepath => filepath.trim()).filter(Boolean)
      if (filepaths.length === 0) {
        return { error: `${flag} requires a path` }
      }

      paths.push(...filepaths)
      pathSet = true
      continue
    }

    if (arg.startsWith('-')) {
      return { error: `unknown option: ${arg}` }
    }

    commandIndex = i
    break
  }

  const command = commandIndex === -1 ? [] : args.slice(commandIndex)
  return {
    paths,
    pathSet,
    quiet,
    debug,
    override,
    fast,
    command
  }
}

function resolveHome (envPath) {
  return envPath[0] === '~' ? path.join(os.homedir(), envPath.slice(1)) : envPath
}

function resolveRunOptions (parsed) {
  const envOptions = optionsFromEnv()
  const options = {
    encoding: envOptions.encoding || 'utf8',
    quiet: envOptions.quiet === true,
    debug: envOptions.debug === true,
    override: envOptions.override === true,
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
  if (parsed.fast != null) options.fast = parsed.fast

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

  const interactive = Boolean(process.stdin.isTTY)
  // A separate group lets services/CI stop descendants too. Interactive children
  // stay in the terminal's foreground group so stdin and Ctrl-C work normally.
  const useProcessGroup = process.platform !== 'win32' && !interactive
  const child = cp.spawn(parsed.command[0], parsed.command.slice(1), {
    stdio: 'inherit',
    detached: useProcessGroup,
    shell: process.platform === 'win32'
  })

  const handlers = new Map()
  let interrupts = 0

  function forward (signal) {
    if (!child.pid || child.exitCode !== null || child.signalCode !== null) return

    if (process.platform === 'win32') {
      // Windows has no POSIX process-group signals; include the shell's children.
      cp.spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
      return
    }

    try {
      process.kill(useProcessGroup ? -child.pid : child.pid, signal)
    } catch (error) {
      if (error.code !== 'ESRCH') throw error
    }
  }

  function cleanup () {
    for (const [signal, handler] of handlers) process.removeListener(signal, handler)
  }

  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGQUIT']) {
    const handler = () => {
      if (signal === 'SIGINT') {
        interrupts++
        // The terminal already delivers Ctrl-C to the foreground child. Further
        // interrupts escalate instead of duplicating its graceful shutdown.
        if (interactive && process.platform !== 'win32' && interrupts === 1) return
        if (interrupts > 1) {
          forward(interrupts === 2 ? 'SIGTERM' : 'SIGKILL')
          return
        }
      }
      forward(signal)
    }
    handlers.set(signal, handler)
    process.on(signal, handler)
  }

  child.on('error', function (e) {
    cleanup()
    console.error(`dotenv: ${e.message}`)
    process.exitCode = 1
  })

  child.on('exit', function (exitCode, signal) {
    cleanup()
    if (typeof exitCode === 'number') {
      process.exit(exitCode)
    } else {
      // Keep the event loop alive until the re-raised signal terminates us.
      // Otherwise Node can finish normally before delivery and report exit 0.
      setInterval(() => {}, 1000)
      process.kill(process.pid, signal)
    }
  })
}

module.exports = run

if (require.main === module) {
  run(process.argv.slice(2))
}
