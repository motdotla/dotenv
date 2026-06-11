#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const cp = require('child_process')

const dotenv = require('./lib/main')

function printHelp () {
  console.log([
    'Usage: dotenv run [--help] [-f <path>] -- <command>',
    '',
    'Run a command with environment variables from a .env file.',
    '',
    'Options:',
    '  -f <path>  path to your .env file (default: .env)'
  ].join('\n'))
}

function parseRunArgs (args) {
  const paths = []
  let defaultPath = true
  let commandIndex = -1

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--') {
      commandIndex = i + 1
      break
    }

    if (arg === '--help' || arg === '-h') {
      return { help: true, paths, command: [] }
    }

    if (arg === '-f') {
      const filepath = args[i + 1]
      if (!filepath || filepath === '--') {
        return { error: '-f requires a path' }
      }

      paths.push(filepath)
      defaultPath = false
      i++
      continue
    }

    if (arg.startsWith('-f=')) {
      const filepath = arg.slice(3)
      if (!filepath) {
        return { error: '-f requires a path' }
      }

      paths.push(filepath)
      defaultPath = false
      continue
    }

    return { error: `unknown option: ${arg}` }
  }

  const command = commandIndex === -1 ? [] : args.slice(commandIndex)
  return {
    paths: paths.length > 0 ? paths : ['.env'],
    defaultPath,
    command
  }
}

function loadEnvFiles (paths, defaultPath) {
  const parsedAll = {}

  for (const filepath of paths) {
    const resolvedPath = path.resolve(process.cwd(), filepath)
    try {
      const parsed = dotenv.parse(fs.readFileSync(resolvedPath, { encoding: 'utf8' }))
      dotenv.populate(parsedAll, parsed)
    } catch (e) {
      if (!(defaultPath && e.code === 'ENOENT')) {
        throw e
      }
    }
  }

  dotenv.populate(process.env, parsedAll)
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

  try {
    loadEnvFiles(parsed.paths, parsed.defaultPath)
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

run(process.argv.slice(2))
