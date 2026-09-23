'use strict'
// Run with `npm run test:perf` or `node scripts/parse-perf.js`.
// CI runs this separately from the parallel test suite to reduce timing noise.
// Requires at least a 1.5x speedup for both strings and buffers, using median
// ms over 7 rotating runs of 5000 calls after warming up all parsers.
// Native util.parseEnv() is included for comparison when available; the gate
// compares dotenv's fast parser against classic only.

const assert = require('assert')
const fs = require('fs')
const { parseEnv } = require('util')
const dotenv = require('../lib/main.js')

const sample = [
  '# Database',
  'DATABASE_URL=postgresql://user:password@localhost:5432/mydb?schema=public',
  'REDIS_URL=redis://default:password@localhost:6379',
  '',
  '# Auth',
  'JWT_SECRET=verylongrandomstringthatlookslikeasecretsharedacrossservices',
  'OAUTH_GOOGLE_CLIENT_ID=1234567890-abcdefg.apps.googleusercontent.com',
  'OAUTH_GITHUB_CLIENT_SECRET=ghp_abcdefghijklmnopqrstuvwxyz',
  '',
  '# AWS',
  'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE',
  'AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  'S3_BUCKET=my-app-uploads-prod',
  '',
  '# Quoted / multiline',
  'EMAIL_FROM="MyApp <noreply@myapp.com>"',
  'ALLOWED_ORIGINS="https://myapp.com,https://www.myapp.com"',
  'MULTILINE_KEY="line one\\nline two\\nline three"',
  '',
  '# Misc',
  'NODE_ENV=production',
  'PORT=3000',
  'LOG_LEVEL=info',
  'FEATURE_FLAG_A=true',
  ''
].join('\n').repeat(8)

const N = 5000
const minimumSpeedup = 1.5
const fastOptions = { fast: true }
const report = [
  '## Parser benchmark',
  '',
  `Node ${process.version} | ${process.platform} ${process.arch}`,
  '',
  `Median of 7 runs of ${N} parses after 1000 warmup calls per parser. Lower time is better.`,
  'Buffer timings include decoding to a string. Speedup is relative to classic.',
  '',
  '| Input | Parser | Median (ms / 5000 parses) | Parses/sec | Speedup vs classic |',
  '| --- | --- | ---: | ---: | ---: |'
]
const gateResults = []

if (typeof parseEnv !== 'function') {
  console.log('Native util.parseEnv() unavailable; skipping native comparison (requires Node 20.12+).')
}

for (const [format, src] of [['Buffer', Buffer.from(sample)], ['string', sample]]) {
  const parsers = [
    { name: 'classic', parse: () => dotenv.parse(src), runs: [] },
    { name: 'fast', parse: () => dotenv.parse(src, fastOptions), runs: [] }
  ]
  if (typeof parseEnv === 'function') {
    // Native parsing accepts strings only; include Buffer decoding in its timing.
    parsers.push({ name: 'native', parse: () => parseEnv(typeof src === 'string' ? src : src.toString()), runs: [] })
  }
  const expected = parsers[0].parse()
  for (const parser of parsers) {
    // Compare key/value pairs; native results may have a null prototype.
    assert.deepStrictEqual({ ...parser.parse() }, expected, `${format} ${parser.name} output matches classic`)
    for (let i = 0; i < 1000; i++) parser.parse()
  }
  for (let r = 0; r < 7; r++) {
    // Rotate order so each parser can run first in a round.
    for (let offset = 0; offset < parsers.length; offset++) {
      const parser = parsers[(r + offset) % parsers.length]
      const start = process.hrtime.bigint()
      for (let i = 0; i < N; i++) parser.parse()
      parser.runs.push(Number(process.hrtime.bigint() - start) / 1e6)
    }
  }
  for (const parser of parsers) {
    parser.runs.sort((a, b) => a - b)
    parser.median = parser.runs[3]
  }
  for (const parser of parsers) {
    const label = parser.name === 'native' ? 'Node util.parseEnv()' : `dotenv ${parser.name}`
    report.push(`| ${format} | ${label} | ${parser.median.toFixed(2)} | ${Math.round(N * 1000 / parser.median)} | ${(parsers[0].median / parser.median).toFixed(2)}x |`)
  }
  const speedup = parsers[0].median / parsers[1].median
  gateResults.push(`${format}: ${speedup < minimumSpeedup ? 'FAIL' : 'PASS'} — fast vs classic ${speedup.toFixed(2)}x (minimum ${minimumSpeedup}x).`)
  if (speedup < minimumSpeedup) {
    console.error(`${format}: fast parser must be at least ${minimumSpeedup}x as fast as classic; measured ${speedup.toFixed(2)}x`)
    process.exitCode = 1
  }
}

report.push('', 'CI gate: dotenv fast must be at least 1.5x as fast as classic for each input format. Native is informational.', '', ...gateResults, '')
const markdown = report.join('\n')
console.log(markdown)
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown + '\n')
}
