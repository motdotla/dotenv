const cp = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const t = require('tap')

function kill (pid, signal = 'SIGKILL') {
  try {
    process.kill(pid, signal)
  } catch (error) {
    if (error.code !== 'ESRCH') throw error
  }
}

async function launch (ct, script, preload) {
  const args = preload ? ['--require', preload] : []
  const child = cp.spawn(process.execPath, [
    ...args, 'dist/index.cjs', 'run', '-q', '--', process.execPath, '-e', script
  ], {
    cwd: path.resolve(__dirname, '..'),
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    // Exercise normal Node signal behavior without the test runner's preload hooks.
    env: { ...process.env, NODE_OPTIONS: '' }
  })
  let output = ''
  let errors = ''
  let commandPid
  const exited = new Promise(resolve => child.once('exit', (code, signal) => resolve({ code, signal })))
  const ready = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Child did not become ready: ${errors}`)), 5000)
    ct.teardown(() => clearTimeout(timeout))
    child.once('error', reject)
    child.stdout.on('data', chunk => {
      output += chunk
      if (!commandPid && output.includes('\n')) {
        commandPid = Number(output.split('\n')[0])
        clearTimeout(timeout)
        resolve()
      }
    })
  })
  child.stderr.on('data', chunk => { errors += chunk })
  ct.teardown(() => {
    // Both groups belong to this test. Clean up even when an assertion fails.
    if (commandPid && !preload) kill(-commandPid)
    kill(-child.pid)
  })
  await ready
  return { child, exited, output: () => output, errors: () => errors }
}

const keepAlive = 'setInterval(() => {}, 1000); console.log(process.pid)'

t.test('POSIX signal forwarding', { skip: process.platform === 'win32' }, async ct => {
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGQUIT']) {
    await ct.test(`forwards ${signal} and waits for graceful shutdown`, async st => {
      const command = await launch(st, `
        process.once('${signal}', () => {
          console.log('received ${signal}')
          setTimeout(() => { console.log('cleanup complete'); process.exit(23) }, 100)
        })
        ${keepAlive}
      `)
      command.child.kill(signal)
      st.same(await command.exited, { code: 23, signal: null })
      st.match(command.output(), `received ${signal}\ncleanup complete\n`)
      st.equal(command.errors(), '')
    })
  }

  await ct.test('preserves signal exit status', async st => {
    const command = await launch(st, keepAlive)
    command.child.kill('SIGTERM')
    st.same(await command.exited, { code: null, signal: 'SIGTERM' })
  })

  await ct.test('forwards termination to subprocesses too', async st => {
    const grandchild = "process.once('SIGTERM', () => { console.log('grandchild stopped'); process.exit(0) }); setInterval(() => {}, 1000); process.send('ready')"
    const command = await launch(st, `
      const cp = require('child_process')
      const child = cp.spawn(process.execPath, ['-e', ${JSON.stringify(grandchild)}], { stdio: ['ignore', 'inherit', 'inherit', 'ipc'] })
      process.once('SIGTERM', () => child.once('exit', () => process.exit(0)))
      child.once('message', () => console.log(process.pid))
    `)
    command.child.kill('SIGTERM')
    st.same(await command.exited, { code: 0, signal: null })
    st.match(command.output(), 'grandchild stopped')
  })

  await ct.test('terminal group Ctrl-C is not forwarded twice', async st => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenv-signals-'))
    st.teardown(() => fs.rmSync(dir, { recursive: true, force: true }))
    const preload = path.join(dir, 'tty.cjs')
    // Simulate terminal delivery by sending SIGINT to the foreground group.
    fs.writeFileSync(preload, 'Object.defineProperty(process.stdin, "isTTY", { value: true })')
    const command = await launch(st, `
      let count = 0
      process.on('SIGINT', () => {
        count++
        setTimeout(() => { console.log('interrupts=' + count); process.exit(count === 1 ? 0 : 1) }, 100)
      })
      ${keepAlive}
    `, preload)
    kill(-command.child.pid, 'SIGINT')
    st.same(await command.exited, { code: 0, signal: null })
    st.match(command.output(), 'interrupts=1')
  })

  await ct.test('repeated interrupts can force an unresponsive child to stop', async st => {
    const command = await launch(st, `
      process.on('SIGINT', () => {})
      process.on('SIGTERM', () => {})
      ${keepAlive}
    `)
    command.child.kill('SIGINT')
    await new Promise(resolve => setTimeout(resolve, 50))
    command.child.kill('SIGINT')
    await new Promise(resolve => setTimeout(resolve, 50))
    command.child.kill('SIGINT')
    st.same(await command.exited, { code: null, signal: 'SIGKILL' })
  })
})
