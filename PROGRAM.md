# Research Program

cli_version: 0.5.2
lead_github_login: motdotla
maintainer_github_login: motdotla
metric_tolerance: 0.01
metric_direction: higher_is_better
required_confirmations: 0
auto_approve: true
min_queue_depth: 5
assignment_timeout: 24h

## Goal

Increase throughput (ops/sec) of `dotenv.parse` on the bundled `tests/.env` fixture, while keeping the full `npm test` suite passing. Baseline is measured by the benchmark in PREPARE.md; a run only counts if every tap test passes.

## What you CAN modify

- `lib/**` — parser, config loader, env/CLI option shims, type declarations
- `config.js`, `config.d.ts` — preload entry point

## What you CANNOT modify

- `PROGRAM.md` — research program specification
- `PREPARE.md` — evaluation setup and trust boundary
- `.polyresearch/`, `.polyresearch-node.toml` — runtime directory and node config
- `tests/**` — test suite and fixtures (the correctness gate)
- `package.json`, `package-lock.json` — dependency and script definitions
- `.github/**` — CI configuration
- `README.md`, `README-es.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`, `LICENSE` — docs and metadata
- `results.tsv` — experiment history (append-only, managed by the CLI)
- Any file that defines the evaluation harness or scoring logic

## Constraints

- All changes must pass the evaluation harness defined in PREPARE.md.
- Each experiment should be atomic and independently verifiable.
- All else being equal, simpler is better. A small improvement that adds ugly complexity is not worth keeping. Removing code and getting equal or better results is a great outcome.
- If a run crashes, use judgment: fix trivial bugs (typos, missing imports) and re-run. If the idea is fundamentally broken, skip it and move on.
- Document what you tried and what you observed in the attempt summary.

## Strategy hints

- Read the full codebase before your first experiment. Understand what you are working with.
- Start with the lowest-hanging fruit.
- Measure before and after every change.
- Read results.tsv to learn from history. Do not repeat approaches that already failed.
- If an approach does not show improvement after reasonable effort, release and move on.
- Try combining ideas from previous near-misses.
- If you are stuck, try something more radical. Re-read the source for new angles.
