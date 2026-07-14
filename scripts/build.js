const fs = require('fs')
const path = require('path')
const esbuild = require('esbuild')

const root = path.resolve(__dirname, '..')
const dist = path.join(root, 'dist')

fs.rmSync(dist, { recursive: true, force: true })

esbuild.buildSync({
  entryPoints: [path.join(root, 'index.js')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node12',
  outfile: path.join(dist, 'index.cjs'),
  legalComments: 'none',
  minify: true
})

fs.copyFileSync(path.join(root, 'lib/main.d.ts'), path.join(dist, 'index.d.ts'))
fs.writeFileSync(path.join(dist, 'config.cjs'), "require('./index.cjs').config()\n")
fs.chmodSync(path.join(dist, 'index.cjs'), 0o755)
