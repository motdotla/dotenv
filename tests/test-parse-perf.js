'use strict'
// Performance check for `dotenv.parse()`.
// No TAP assertions; invoke directly for standalone timing:
//   node tests/test-parse-perf.js
// Compares classic and fast parsing of strings and buffers, reporting median
// ms over 7 runs of 5000 calls on a representative .env. Timing is not a CI gate.

const assert = require('assert')
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
const fastOptions = { fast: true }

for (const [format, src] of [['Buffer', Buffer.from(sample)], ['string', sample]]) {
  const parsers = [
    { name: 'classic', parse: () => dotenv.parse(src), runs: [] },
    { name: 'fast', parse: () => dotenv.parse(src, fastOptions), runs: [] }
  ]
  assert.deepStrictEqual(parsers[1].parse(), parsers[0].parse())
  for (const parser of parsers) {
    for (let i = 0; i < 1000; i++) parser.parse()
  }
  for (let r = 0; r < 7; r++) {
    // Alternate order so either parser can run first in a round.
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
    console.log(`${format} ${parser.name} x ${N}: median ${parser.median.toFixed(2)} ms`)
  }
  console.log(`${format} speedup: ${(parsers[0].median / parsers[1].median).toFixed(2)}x`)
}
