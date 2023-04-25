<div align="center">

<p>
  <sup>
    <a href="https://github.com/sponsors/motdotla">Dotenv is supported by the community.</a>
  </sup>
</p>
<sup>Special thanks to:</sup>
<br>
<br>
<a href="https://www.warp.dev/?utm_source=github&utm_medium=referral&utm_campaign=dotenv_p_20220831">
  <div>
    <img src="https://res.cloudinary.com/dotenv-org/image/upload/v1661980709/warp_hi8oqj.png" width="230" alt="Warp">
  </div>
  <b>Warp is a blazingly fast, Rust-based terminal reimagined to work like a modern app.</b>
  <div>
    <sup>Get more done in the CLI with real text editing, block-based output, and AI command search.</sup>
  </div>
</a>
<br>
<a href="https://retool.com/?utm_source=sponsor&utm_campaign=dotenv">
  <div>
    <img src="https://res.cloudinary.com/dotenv-org/image/upload/c_scale,w_300/v1664466968/logo-full-black_vidfqf.png" width="270" alt="Retool">
  </div>
  <b>Retool helps developers build custom internal software, like CRUD apps and admin panels, really fast.</b>
  <div>
    <sup>Build UIs visually with flexible components, connect to any data source, and write business logic in JavaScript.</sup>
  </div>
</a>
<br>
<a href="https://workos.com/?utm_campaign=github_repo&utm_medium=referral&utm_content=dotenv&utm_source=github">
  <div>
    <img src="https://res.cloudinary.com/dotenv-org/image/upload/c_scale,w_400/v1665605496/68747470733a2f2f73696e647265736f726875732e636f6d2f6173736574732f7468616e6b732f776f726b6f732d6c6f676f2d77686974652d62672e737667_zdmsbu.svg" width="270" alt="WorkOS">
  </div>
  <b>Your App, Enterprise Ready.</b>
  <div>
    <sup>Add Single Sign-On, Multi-Factor Auth, and more, in minutes instead of months.</sup>
  </div>
</a>
<hr>
<br>
</div>

[![dotenv-vault](https://badge.dotenv.org/works-with.svg?r=1)](https://www.dotenv.org/r/github.com/dotenv-org/dotenv-vault?r=1) 

# dotenv

<img src="https://raw.githubusercontent.com/motdotla/dotenv/master/dotenv.svg" alt="dotenv" align="right" width="200" />

Dotenv is a zero-dependency module that loads environment variables from a `.env` file into [`process.env`](https://nodejs.org/docs/latest/api/process.html#process_process_env). Storing configuration in the environment separate from code is based on [The Twelve-Factor App](http://12factor.net/config) methodology.

[![NPM version](https://img.shields.io/npm/v/dotenv.svg?style=flat-square)](https://www.npmjs.com/package/dotenv)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
[![Coverage Status](https://img.shields.io/coveralls/motdotla/dotenv/master.svg?style=flat-square)](https://coveralls.io/github/motdotla/dotenv?branch=coverall-intergration)
[![LICENSE](https://img.shields.io/github/license/motdotla/dotenv.svg)](LICENSE)

* [🌱 Install](#-install)
* [🏗️ Usage (.env)](#%EF%B8%8F-usage)
* [🚀 Deploying (.env.vault) 🆕](#-deploying)
* [🌴 Examples](#-examples)
* [🦮 Docs](#-documentation)
* [❓ FAQ](#-faq)
* [⏱️ Changelog](./CHANGELOG.md)

## 🌱 Install

```bash
# install locally (recommended)
npm install dotenv --save
```

Or installing with yarn? `yarn add dotenv`

## 🏗️ Usage

Create a `.env` file in the root of your project:

```dosini
S3_BUCKET="YOURS3BUCKET"
SECRET_KEY="YOURSECRETKEYGOESHERE"
```

As early as possible in your application, import and configure dotenv:

```javascript
require('dotenv').config()
console.log(process.env) // remove this after you've confirmed it is working
```

.. or using ES6?

```javascript
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
import express from 'express'
```

That's it. `process.env` now has the keys and values you defined in your `.env` file:

```javascript
require('dotenv').config()

...

s3.getBucketCors({Bucket: process.env.S3_BUCKET}, function(err, data) {})
```

### Multiline values

If you need multiline variables, for example private keys, those are now supported (`>= v15.0.0`) with line breaks:

```dosini
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
...
Kh9NV...
...
-----END RSA PRIVATE KEY-----"
```

Alternatively, you can double quote strings and use the `\n` character:

```dosini
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nKh9NV...\n-----END RSA PRIVATE KEY-----\n"
```

### Comments

Comments may be added to your file on their own line or inline:

```dosini
# This is a comment
SECRET_KEY=YOURSECRETKEYGOESHERE # comment
SECRET_HASH="something-with-a-#-hash"
```

Comments begin where a `#` exists, so if your value contains a `#` please wrap it in quotes. This is a breaking change from `>= v15.0.0` and on.

### Parsing

The engine which parses the contents of your file containing environment variables is available to use. It accepts a String or Buffer and will return an Object with the parsed keys and values.

```javascript
const dotenv = require('dotenv')
const buf = Buffer.from('BASIC=basic')
const config = dotenv.parse(buf) // will return an object
console.log(typeof config, config) // object { BASIC : 'basic' }
```

### Preload

You can use the `--require` (`-r`) [command line option](https://nodejs.org/api/cli.html#-r---require-module) to preload dotenv. By doing this, you do not need to require and load dotenv in your application code.

```bash
$ node -r dotenv/config your_script.js
```

The configuration options below are supported as command line arguments in the format `dotenv_config_<option>=value`

```bash
$ node -r dotenv/config your_script.js dotenv_config_path=/custom/path/to/.env dotenv_config_debug=true
```

Additionally, you can use environment variables to set configuration options. Command line arguments will precede these.

```bash
$ DOTENV_CONFIG_<OPTION>=value node -r dotenv/config your_script.js
```

```bash
$ DOTENV_CONFIG_ENCODING=latin1 DOTENV_CONFIG_DEBUG=true node -r dotenv/config your_script.js dotenv_config_path=/custom/path/to/.env
```

### Variable Expansion

You need to add the value of another variable in one of your variables? Use [dotenv-expand](https://github.com/motdotla/dotenv-expand).

### Syncing

You need to keep `.env` files in sync between machines, environments, or team members? Use [dotenv-vault](https://github.com/dotenv-org/dotenv-vault).

## 🚀 Deploying

**Note: Unreleased. Coming May, 2023! Releasing as dotenv@16.1.0.**

Up until recently (year 2023), we did not have an opinion on deploying your secrets to production. Dotenv had been focused on solving development secrets only. However, with the increasing number of secrets breaches like the [CircleCI breach](https://techcrunch.com/2023/01/05/circleci-breach/) we have formed an opinion.

Don't scatter your secrets across multiple platforms and tools. Use a `.env.vault` file.

The `.env.vault` file encrypts your secrets and decrypts them just-in-time on boot of your application. It uses a `DOTENV_KEY` environment variable that you set on your cloud platform or server. If there is a secrets breach, an attacker only gains access to your decryption key, not your secrets. They would additionally have to gain access to your codebase, find your .env.vault file, and decrypt it to get your secrets. This is much harder and more time consuming for an attacker.

It works in 3 easy steps.

### 1. Create .env.ENVIRONMENT files

In addition to your `.env` (development) file, create a `.env.ci`, `.env.staging`, and `.env.production` file.

(Have a custom environment? Just append it's name. For example, `.env.prod`.)

Put your respective secrets in each of those files, just like you always have with your `.env` files. These files should NOT be committed to code.

### 2. Generate .env.vault file

Run the build command to generate your `.env.vault` file.

```
$ npx dotenv-vault local build
```

This command will read the contents of each of your `.env.*` files, encrypt them, and inject the encrypted versions into your `.env.vault` file. For example:

```
# .env.vault (generated with npx dotenv-vault local build)
DOTENV_VAULT_DEVELOPMENT="X/GOMD7h/Fygjyq3+K2zbdyTBUBVA+mLivaSebqDMnLAencDGu9YvJji"
DOTENV_VAULT_CI="SNnKvHTezcd0B8L+81lhcig+6GfkRxnlrgS1GG/2tJZ7KghOEJnM"
DOTENV_VAULT_PRODUCTION="FudgivxdMrCKOKUeN+QieuCAoGiC2MstXL8JU6Pp4ILYu9wEwfqe4ne3e2jcVys="
DOTENV_VAULT_STAGING="CZXrvrTusPLJlgm62uEppwCKZt6zEr4TGwlP8Z0McJd7I8KBF522JnhT9/8="
```

Commit your `.env.vault` file safely to code. It SHOULD be committed to code.

### 3. Set DOTENV_KEY

The build command also created a `.env.keys` file for you. This is where your `DOTENV_KEY` decryption keys live per environment.

```
# DOTENV_KEYs (generated with npx dotenv-vault local build)
DOTENV_KEY_DEVELOPMENT="dotenv://:key_fc5c0d276e032a1e5ff295f59d7b63db75b0ae1a5a82ad411f4887c23dc78bd1@dotenv.local/vault/.env.vault?environment=development"
DOTENV_KEY_CI="dotenv://:key_c6bc0b1269b53ee852b269c4ea6d82d82619081f2faddb1e05894fbe90c1ef46@dotenv.local/vault/.env.vault?environment=ci"
DOTENV_KEY_STAGING="dotenv://:key_09ec9bfe7a4512b71b3b1ab12aa2f843f47b8c9dc7d0d954e206f37ca125da69@dotenv.local/vault/.env.vault?environment=staging"
```

Go to your web server or cloud platform and set the environment variable `DOTENV_KEY` with the production value. For example, in heroku I'd run the following command.

```
heroku config:set DOTENV_KEY=dotenv://:key_bfa00115ecacb678ba44376526b2f0b3131aa0060f18de357a63eda08af6a7fe@dotenv.local/vault/.env.vault?environment=production
```

Then deploy your code. On boot, the `dotenv` library (>= 16.1.0) will see that a `DOTENV_KEY` is set and use its value to decrypt the production contents of the `.env.vault` file and inject them into your process.

No more scattered secrets across multiple platforms and tools.

## 🌴 Examples

See [examples](https://github.com/dotenv-org/examples) of using dotenv with various frameworks, languages, and configurations.

* [nodejs](https://github.com/dotenv-org/examples/tree/master/dotenv-nodejs)
* [nodejs (debug on)](https://github.com/dotenv-org/examples/tree/master/dotenv-nodejs-debug)
* [nodejs (override on)](https://github.com/dotenv-org/examples/tree/master/dotenv-nodejs-override)
* [esm](https://github.com/dotenv-org/examples/tree/master/dotenv-esm)
* [esm (preload)](https://github.com/dotenv-org/examples/tree/master/dotenv-esm-preload)
* [typescript](https://github.com/dotenv-org/examples/tree/master/dotenv-typescript)
* [typescript parse](https://github.com/dotenv-org/examples/tree/master/dotenv-typescript-parse)
* [typescript config](https://github.com/dotenv-org/examples/tree/master/dotenv-typescript-config)
* [webpack](https://github.com/dotenv-org/examples/tree/master/dotenv-webpack)
* [webpack (plugin)](https://github.com/dotenv-org/examples/tree/master/dotenv-webpack2)
* [react](https://github.com/dotenv-org/examples/tree/master/dotenv-react)
* [react (typescript)](https://github.com/dotenv-org/examples/tree/master/dotenv-react-typescript)
* [express](https://github.com/dotenv-org/examples/tree/master/dotenv-express)
* [nestjs](https://github.com/dotenv-org/examples/tree/master/dotenv-nestjs)
* [fastify](https://github.com/dotenv-org/examples/tree/master/dotenv-fastify)

## 🦮 Documentation

Dotenv exposes two functions:

* `config`
* `parse`

### Config

`config` will read your `.env` file, parse the contents, assign it to
[`process.env`](https://nodejs.org/docs/latest/api/process.html#process_process_env),
and return an Object with a `parsed` key containing the loaded content or an `error` key if it failed.

```js
const result = dotenv.config()

if (result.error) {
  throw result.error
}

console.log(result.parsed)
```

You can additionally, pass options to `config`.

#### Options

##### Path

Default: `path.resolve(process.cwd(), '.env')`

Specify a custom path if your file containing environment variables is located elsewhere.

```js
require('dotenv').config({ path: '/custom/path/to/.env' })
```

##### Encoding

Default: `utf8`

Specify the encoding of your file containing environment variables.

```js
require('dotenv').config({ encoding: 'latin1' })
```

##### Debug

Default: `false`

Turn on logging to help debug why certain keys or values are not being set as you expect.

```js
require('dotenv').config({ debug: process.env.DEBUG })
```

##### Override

Default: `false`

Override any environment variables that have already been set on your machine with values from your .env file.

```js
require('dotenv').config({ override: true })
```

### Parse

The engine which parses the contents of your file containing environment
variables is available to use. It accepts a String or Buffer and will return
an Object with the parsed keys and values.

```js
const dotenv = require('dotenv')
const buf = Buffer.from('BASIC=basic')
const config = dotenv.parse(buf) // will return an object
console.log(typeof config, config) // object { BASIC : 'basic' }
```

#### Options

##### Debug

Default: `false`

Turn on logging to help debug why certain keys or values are not being set as you expect.

```js
const dotenv = require('dotenv')
const buf = Buffer.from('hello world')
const opt = { debug: true }
const config = dotenv.parse(buf, opt)
// expect a debug message because the buffer is not in KEY=VAL form
```

## ❓ FAQ

### Why is the `.env` file not loading my environment variables successfully?

Most likely your `.env` file is not in the correct place. [See this stack overflow](https://stackoverflow.com/questions/42335016/dotenv-file-is-not-loading-environment-variables).

Turn on debug mode and try again..

```js
require('dotenv').config({ debug: true })
```

You will receive a helpful error outputted to your console.

### Should I commit my `.env` file?

No. We **strongly** recommend against committing your `.env` file to version
control. It should only include environment-specific values such as database
passwords or API keys. Your production database should have a different
password than your development database.

### Should I have multiple `.env` files?

No. We **strongly** recommend against having a "main" `.env` file and an "environment" `.env` file like `.env.test`. Your config should vary between deploys, and you should not be sharing values between environments.

> In a twelve-factor app, env vars are granular controls, each fully orthogonal to other env vars. They are never grouped together as “environments”, but instead are independently managed for each deploy. This is a model that scales up smoothly as the app naturally expands into more deploys over its lifetime.
>
> – [The Twelve-Factor App](http://12factor.net/config)

### What rules does the parsing engine follow?

The parsing engine currently supports the following rules:

- `BASIC=basic` becomes `{BASIC: 'basic'}`
- empty lines are skipped
- lines beginning with `#` are treated as comments
- `#` marks the beginning of a comment (unless when the value is wrapped in quotes)
- empty values become empty strings (`EMPTY=` becomes `{EMPTY: ''}`)
- inner quotes are maintained (think JSON) (`JSON={"foo": "bar"}` becomes `{JSON:"{\"foo\": \"bar\"}"`)
- whitespace is removed from both ends of unquoted values (see more on [`trim`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim)) (`FOO=  some value  ` becomes `{FOO: 'some value'}`)
- single and double quoted values are escaped (`SINGLE_QUOTE='quoted'` becomes `{SINGLE_QUOTE: "quoted"}`)
- single and double quoted values maintain whitespace from both ends (`FOO="  some value  "` becomes `{FOO: '  some value  '}`)
- double quoted values expand new lines (`MULTILINE="new\nline"` becomes

```
{MULTILINE: 'new
line'}
```

- backticks are supported (`` BACKTICK_KEY=`This has 'single' and "double" quotes inside of it.` ``)

### What happens to environment variables that were already set?

By default, we will never modify any environment variables that have already been set. In particular, if there is a variable in your `.env` file which collides with one that already exists in your environment, then that variable will be skipped.

If instead, you want to override `process.env` use the `override` option.

```javascript
require('dotenv').config({ override: true })
```

### How come my environment variables are not showing up for React?

Your React code is run in Webpack, where the `fs` module or even the `process` global itself are not accessible out-of-the-box. `process.env` can only be injected through Webpack configuration.

If you are using [`react-scripts`](https://www.npmjs.com/package/react-scripts), which is distributed through [`create-react-app`](https://create-react-app.dev/), it has dotenv built in but with a quirk. Preface your environment variables with `REACT_APP_`. See [this stack overflow](https://stackoverflow.com/questions/42182577/is-it-possible-to-use-dotenv-in-a-react-project) for more details.

If you are using other frameworks (e.g. Next.js, Gatsby...), you need to consult their documentation for how to inject environment variables into the client.

### Can I customize/write plugins for dotenv?

Yes! `dotenv.config()` returns an object representing the parsed `.env` file. This gives you everything you need to continue setting values on `process.env`. For example:

```js
const dotenv = require('dotenv')
const variableExpansion = require('dotenv-expand')
const myEnv = dotenv.config()
variableExpansion(myEnv)
```

### How do I use dotenv with `import`?

Simply..

```javascript
// index.mjs (ESM)
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
import express from 'express'
```

A little background..

> When you run a module containing an `import` declaration, the modules it imports are loaded first, then each module body is executed in a depth-first traversal of the dependency graph, avoiding cycles by skipping anything already executed.
>
> – [ES6 In Depth: Modules](https://hacks.mozilla.org/2015/08/es6-in-depth-modules/)

What does this mean in plain language? It means you would think the following would work but it won't.

```js
// errorReporter.mjs
import { Client } from 'best-error-reporting-service'

export default new Client(process.env.API_KEY)

// index.mjs
import dotenv from 'dotenv'
dotenv.config()

import errorReporter from './errorReporter.mjs'
errorReporter.report(new Error('documented example'))
```

`process.env.API_KEY` will be blank.

Instead the above code should be written as..

```js
// errorReporter.mjs
import { Client } from 'best-error-reporting-service'

export default new Client(process.env.API_KEY)

// index.mjs
import * as dotenv from 'dotenv'
dotenv.config()

import errorReporter from './errorReporter.mjs'
errorReporter.report(new Error('documented example'))
```

Does that make sense? It's a bit unintuitive, but it is how importing of ES6 modules work. Here is a [working example of this pitfall](https://github.com/dotenv-org/examples/tree/master/dotenv-es6-import-pitfall).

There are two alternatives to this approach:

1. Preload dotenv: `node --require dotenv/config index.js` (_Note: you do not need to `import` dotenv with this approach_)
2. Create a separate file that will execute `config` first as outlined in [this comment on #133](https://github.com/motdotla/dotenv/issues/133#issuecomment-255298822)

### What about variable expansion?

Try [dotenv-expand](https://github.com/motdotla/dotenv-expand)

### What about syncing and securing .env files?

Use [dotenv-vault](https://github.com/dotenv-org/dotenv-vault)

## Contributing Guide

See [CONTRIBUTING.md](CONTRIBUTING.md)

## CHANGELOG

See [CHANGELOG.md](CHANGELOG.md)

## Who's using dotenv?

[These npm modules depend on it.](https://www.npmjs.com/browse/depended/dotenv)

Projects that expand it often use the [keyword "dotenv" on npm](https://www.npmjs.com/search?q=keywords:dotenv).

[![Limited Edition Tee Original](https://img.shields.io/badge/Limited%20Edition%20Tee%20%F0%9F%91%95-Original-yellow?labelColor=black&style=plastic)](https://dotenv.gumroad.com/l/original)
[![Limited Edition Tee Redacted](https://img.shields.io/badge/Limited%20Edition%20Tee%20%F0%9F%91%95-Redacted-gray?labelColor=black&style=plastic)](https://dotenv.gumroad.com/l/redacted)

