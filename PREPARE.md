# Evaluation Setup

This file is outside the editable surface. It defines how results are judged. Agents cannot modify the evaluator or the scoring logic — the evaluation is the trust boundary.

The primary metric is `dotenv.parse` throughput. The secondary gate is the tap test suite: a run is only scored if every test passes, which prevents throughput "wins" that silently break parsing semantics.

eval_cores: 1
eval_memory_gb: 1.0

## Setup

Requires Node.js >= 18 and npm. From a clean checkout:

```bash
npm ci
```

This installs the exact dev-dependency tree from `package-lock.json` (tap, standard, sinon, typescript, etc.). No network access is required at benchmark time.

## Run command

Runs the full tap test suite as a correctness gate, then benchmarks `parse` on `tests/.env` and prints `METRIC=<ops_per_sec>`.

```bash
npm test >/dev/null 2>&1 || { echo "METRIC=0"; echo "FAIL: npm test did not pass"; exit 1; }

node -e '
const fs = require("fs");
const path = require("path");
const { parse } = require("./lib/main.js");
const src = fs.readFileSync(path.join("tests", ".env"));

// Warmup — let V8 optimize.
for (let i = 0; i < 5000; i++) parse(src);

// Measure: run for ~3 seconds of wall time, report ops/sec as the median
// of 5 independent trials to reduce noise.
const TRIAL_MS = 3000;
const trials = [];
for (let t = 0; t < 5; t++) {
  let ops = 0;
  const start = process.hrtime.bigint();
  const deadline = start + BigInt(TRIAL_MS) * 1000000n;
  while (process.hrtime.bigint() < deadline) {
    for (let i = 0; i < 1000; i++) parse(src);
    ops += 1000;
  }
  const elapsedNs = Number(process.hrtime.bigint() - start);
  trials.push(ops / (elapsedNs / 1e9));
}
trials.sort((a, b) => a - b);
const median = trials[Math.floor(trials.length / 2)];
console.log("trials=" + trials.map(n => n.toFixed(0)).join(","));
console.log("METRIC=" + median.toFixed(2));
'
```

## Output format

The benchmark must print `METRIC=<number>` to stdout. Higher is better (ops/sec).

## Metric parsing

The CLI looks for `METRIC=<number>` or `ops_per_sec=<number>` in the output. Only the final `METRIC=` line is scored; the `trials=` line is diagnostic.

## Ground truth

The metric is the median of 5 × 3-second trials of `dotenv.parse(src)` where `src` is the 43-line, ~2 KB `tests/.env` fixture shipped in this repo. The fixture exercises the full grammar: unquoted values, single/double/backtick-quoted strings, escaped newlines, inline comments, `export` prefixes, and empty values. The `tests/.env` file is part of the protected evaluation surface and must not change — a change there would invalidate the baseline.

Correctness is gated by `npm test`, which runs the tap suite in `tests/**/*.js` (parse, config, populate, vault, CLI options, multiline, decrypt). If any test fails, the run is scored `METRIC=0` and marked failed.
