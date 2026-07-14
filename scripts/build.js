const fs = require('fs')
const path = require('path')
const esbuild = require('esbuild')

const root = path.resolve(__dirname, '..')
const dist = path.join(root, 'dist')

fs.rmSync(dist, { recursive: true, force: true })

esbuild.buildSync({
  entryPoints: [
    path.join(root, 'lib/main.js'),
    path.join(root, 'lib/env-options.js'),
    path.join(root, 'lib/cli-options.js'),
    path.join(root, 'config.js'),
    path.join(root, 'cli.js')
  ],
  platform: 'node',
  format: 'cjs',
  target: 'node12',
  outdir: dist,
  outbase: root,
  legalComments: 'none',
  minify: true
})

fs.copyFileSync(path.join(root, 'lib/main.d.ts'), path.join(dist, 'lib/main.d.ts'))
fs.copyFileSync(path.join(root, 'config.d.ts'), path.join(dist, 'config.d.ts'))
fs.chmodSync(path.join(dist, 'cli.js'), 0o755)
