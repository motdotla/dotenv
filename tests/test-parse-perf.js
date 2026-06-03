'use strict'
// Performance check for `dotenv.parse()`.
// Not run as part of `npm test` (no TAP assertions); invoke directly:
//   node tests/test-parse-perf.js
// Reports median ms over 7 runs of 5000 parse() calls on a representative .env.

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

const buf = Buffer.from(sample)
const N = 5000

for (let i = 0; i < 200; i++) dotenv.parse(buf)

const runs = []
for (let r = 0; r < 7; r++) {
  const t = process.hrtime.bigint()
  for (let i = 0; i < N; i++) dotenv.parse(buf)
  runs.push(Number(process.hrtime.bigint() - t) / 1e6)
}
runs.sort(function (a, b) { return a - b })
console.log('parse() x ' + N + ': median ' + runs[Math.floor(runs.length / 2)].toFixed(2) + ' ms')
