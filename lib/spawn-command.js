const cp = require('child_process')
const fs = require('fs')
const path = require('path')

// Encode an argument for the Windows C runtime: backslashes are literal except
// before a quote, where pairs represent one backslash and an odd one quotes ".
// https://learn.microsoft.com/en-us/cpp/c-language/parsing-c-command-line-arguments
function quoteWindowsArgument (value) {
  const output = ['"']
  let backslashes = 0
  for (const character of value) {
    if (character === '\\') {
      backslashes++
      continue
    }
    if (character === '"') {
      output.push('\\'.repeat(backslashes * 2 + 1), '"')
    } else {
      output.push('\\'.repeat(backslashes), character)
    }
    backslashes = 0
  }
  output.push('\\'.repeat(backslashes * 2), '"')
  return output.join('')
}

// Protect a token from cmd's parser. Quotes must survive this pass so the
// eventual executable can interpret them. Each additional shell pass consumes
// one layer of carets (npm's batch shims parse their forwarded arguments again).
// https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/cmd
function protectShellToken (token, passes = 1) {
  for (let pass = 0; pass < passes; pass++) {
    const output = []
    for (const character of token) {
      const code = character.charCodeAt(0)
      const letterOrDigit = (code >= 48 && code <= 57) ||
        (code >= 65 && code <= 90) || (code >= 97 && code <= 122)
      const pathCharacter = '\\/:._-'.includes(character)
      if (!letterOrDigit && !pathCharacter && code < 128) output.push('^')
      output.push(character)
    }
    token = output.join('')
  }
  return token
}

function envValue (env, name) {
  const key = Object.keys(env).reverse().find(key => key.toUpperCase() === name)
  return key === undefined ? undefined : env[key]
}

function resolveWindowsCommand (command, env, cwd) {
  const extensions = (envValue(env, 'PATHEXT') || '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean)
  const hasExtension = extensions.some(ext => command.toLowerCase().endsWith(ext.toLowerCase()))
  const suffixes = hasExtension ? ['', ...extensions] : [...extensions, '']
  const directories = /[\\/]/.test(command) ? [cwd] : [cwd, ...(envValue(env, 'PATH') || '').split(';')]

  for (const directory of directories) {
    for (const suffix of suffixes) {
      const file = path.resolve(cwd, directory.replace(/^"|"$/g, ''), command + suffix)
      try {
        if (fs.statSync(file).isFile()) return file
      } catch (_) {}
    }
  }
}

function spawnCommand (command, args, options) {
  if (process.platform !== 'win32') return cp.spawn(command, args, options)

  const env = options.env || process.env
  const file = resolveWindowsCommand(command, env, options.cwd || process.cwd())
  if (file && /\.(?:exe|com)$/i.test(file)) {
    // Let Node quote native executable arguments, without cmd.exe interpreting them.
    return cp.spawn(file, args, options)
  }

  const directory = file ? path.dirname(file) : ''
  const npmShim = file && path.extname(file).toLowerCase() === '.cmd' &&
    path.basename(directory).toLowerCase() === '.bin' &&
    path.basename(path.dirname(directory)).toLowerCase() === 'node_modules'
  const tokens = [protectShellToken(path.normalize(file || command))]
  for (const argument of args) {
    tokens.push(protectShellToken(quoteWindowsArgument(argument), npmShim ? 2 : 1))
  }
  const shellCommand = tokens.join(' ')
  return cp.spawn(envValue(env, 'COMSPEC') || 'cmd.exe', ['/d', '/v:off', '/s', '/c', `"${shellCommand}"`], {
    ...options,
    windowsVerbatimArguments: true
  })
}

module.exports = spawnCommand
