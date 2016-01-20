# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

## [2.0.0] - 2016-01-20
### Added
- CHANGELOG to ["make it easier for users and contributors to see precisely what notable changes have been made between each release"](http://keepachangelog.com/). Linked to from README
- LICENSE to be more explicit about what was defined in `package.json`. Linked to from README
- Testing nodejs v4 on travis-ci
- added examples of how to use dotenv in different ways
- return parsed object on success rather than boolean true

### Changed
- README has shorter description not referencing ruby gem since we don't have or want feature parity

### Removed
- Variable expansion and escaping so environment variables are encouraged to be fully orthogonal

## [1.2.0] - 2015-06-20
### Added
- Preload hook to require dotenv without including it in your code

### Changed
- clarified license to be "BSD-2-Clause" in `package.json`

### Fixed
- retain spaces in string vars

## [1.1.0] - 2015-03-31
### Added
- Silent option to silence `console.log` when `.env` missing

## [1.0.0] - 2015-03-13
### Removed
- support for multiple `.env` files. should always use one `.env` file for the current environment

[Unreleased]: https://github.com/motdotla/dotenv/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/motdotla/dotenv/compare/v1.2.0...v2.0.0
[1.2.0]: https://github.com/motdotla/dotenv/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/motdotla/dotenv/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/motdotla/dotenv/compare/v0.4.0...v1.0.0
