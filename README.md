> [dotenvx](https://dotenvx.com/?utm_source=github&utm_medium=readme&utm_campaign=motdotla-dotenv&utm_content=banner) — a secure dotenv, from the creator of `dotenv` for the agentic age. Run anywhere, encrypt secrets, and commit safely.

# dotenv [![NPM version](https://img.shields.io/npm/v/dotenv.svg?style=flat-square)](https://www.npmjs.com/package/dotenv) [![downloads](https://img.shields.io/npm/dw/dotenv)](https://www.npmjs.com/package/dotenv)

<img src="https://raw.githubusercontent.com/motdotla/dotenv/master/dotenv.svg" alt="dotenv" align="right" width="200" />

Dotenv is a zero-dependency module that loads environment variables from a `.env` file into [`process.env`](https://nodejs.org/docs/latest/api/process.html#process_process_env). Storing configuration in the environment separate from code is based on [The Twelve-Factor App](https://12factor.net/config) methodology.

[Watch the tutorial](https://www.youtube.com/watch?v=YtkZR0NFd1g)

&nbsp;

## Usage

Install it.

```sh
npm install dotenv --save
```

Create a `.env` file in the root of your project:

```ini
# .env
HELLO="Dotenv"
OPENAI_API_KEY="your-api-key-goes-here"
```

As early as possible in your application, import and configure dotenv:

```javascript
// index.js
require('dotenv').config()
// or import 'dotenv/config' // for esm

console.log(`Hello ${process.env.HELLO}`)
```
```sh
$ node index.js
◇ injected env (2) from .env
Hello Dotenv
```

That's it. `process.env` now has the keys and values you defined in your `.env` file.

&nbsp;

## Advanced

<details><summary>ES6</summary><br>

Import with [ES6](#how-do-i-use-dotenv-with-import):

```javascript
import 'dotenv/config'
```

`DOTENV_CONFIG_ENCODING`, `DOTENV_CONFIG_PATH`, `DOTENV_CONFIG_QUIET`, `DOTENV_CONFIG_DEBUG`, and `DOTENV_CONFIG_OVERRIDE` provide defaults for `config()`. Options passed directly to `config()` take precedence.

</details>
<details><summary>bun</summary><br>

```sh
bun add dotenv
```

</details>
<details><summary>yarn</summary><br>

```sh
yarn add dotenv
```

</details>
<details><summary>pnpm</summary><br>

```sh
pnpm add dotenv
```

</details>
<details><summary>deno</summary><br>

```sh
deno add dotenv
```

</details>
<details><summary>Monorepos</summary><br>

For monorepos with a structure like `apps/backend/app.js`, put it the `.env` file in the root of the folder where your `app.js` process runs.

```ini
# app/backend/.env
S3_BUCKET="YOURS3BUCKET"
SECRET_KEY="YOURSECRETKEYGOESHERE"
```

</details>
<details><summary>Multiline Values</summary><br>

If you need multiline variables, for example private keys, those are now supported (`>= v15.0.0`) with line breaks:

```ini
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
...
Kh9NV...
...
-----END RSA PRIVATE KEY-----"
```

Alternatively, you can double quote strings and use the `\n` character:

```ini
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nKh9NV...\n-----END RSA PRIVATE KEY-----\n"
```

</details>
<details><summary>Comments</summary><br>

Comments may be added to your file on their own line or inline:

```ini
# This is a comment
SECRET_KEY=YOURSECRETKEYGOESHERE # comment
SECRET_HASH="something-with-a-#-hash"
```

Comments begin where a `#` exists, so if your value contains a `#` please wrap it in quotes. This is a breaking change from `>= v15.0.0` and on.

</details>
<details><summary>Parsing</summary><br>

The engine which parses the contents of your file containing environment variables is available to use. It accepts a String or Buffer and will return an Object with the parsed keys and values.

```javascript
const dotenv = require('dotenv')
const buf = Buffer.from('BASIC=basic')
const config = dotenv.parse(buf) // will return an object
console.log(typeof config, config) // object { BASIC : 'basic' }
```

</details>
<details><summary>Run</summary><br>

Use `dotenv run --` to run a command with environment variables from your `.env` file.

```bash
$ dotenv run -- node index.js
◇ injected env (2) from .env
```

Use `-f` to select one or more `.env` files.

```bash
$ dotenv run -f .env.local -f .env -- node index.js
◇ injected env (2) from .env.local, .env
```

Use `--quiet` to suppress the injected env message.

```bash
$ dotenv run --quiet -- node index.js
```

</details>
<details><summary>Variable Expansion</summary><br>

Use [dotenvx](https://github.com/dotenvx/dotenvx) for variable expansion.

Reference and expand variables already on your machine for use in your .env file.

```ini
# .env
USERNAME="username"
DATABASE_URL="postgres://${USERNAME}@localhost/my_database"
```
```js
// index.js
console.log('DATABASE_URL', process.env.DATABASE_URL)
```
```sh
$ dotenvx run --debug -- node index.js
⟐ injected env (2) from .env · dotenvx@1.59.1
DATABASE_URL postgres://username@localhost/my_database
```

</details>
<details><summary>Command Substitution</summary><br>

Use [dotenvx](https://github.com/dotenvx/dotenvx) for command substitution.

Add the output of a command to one of your variables in your .env file.

```ini
# .env
DATABASE_URL="postgres://$(whoami)@localhost/my_database"
```
```js
// index.js
console.log('DATABASE_URL', process.env.DATABASE_URL)
```
```sh
$ dotenvx run --debug -- node index.js
⟐ injected env (1) from .env · dotenvx@1.59.1
DATABASE_URL postgres://yourusername@localhost/my_database
```

</details>
<details><summary>Encryption</summary><br>

Use [dotenvx](https://github.com/dotenvx/dotenvx) for encryption.

Add encryption to your `.env` files with a single command.

```
$ dotenvx set HELLO Production -f .env.production
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ DOTENV_PRIVATE_KEY_PRODUCTION="<.env.production private key>" dotenvx run -- node index.js
⟐ injected env (2) from .env.production · dotenvx@1.59.1
Hello Production
```

[learn more](https://github.com/dotenvx/dotenvx?tab=readme-ov-file#encryption)

</details>
<details><summary>Multiple Environments</summary><br>

Use [dotenvx](https://github.com/dotenvx/dotenvx) to manage multiple environments.

Run any environment locally. Create a `.env.ENVIRONMENT` file and use `-f` to load it. It's straightforward, yet flexible.

```bash
$ echo "HELLO=production" > .env.production
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ dotenvx run -f=.env.production -- node index.js
Hello production
> ^^
```

or with multiple .env files

```bash
$ echo "HELLO=local" > .env.local
$ echo "HELLO=World" > .env
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ dotenvx run -f=.env.local -f=.env -- node index.js
Hello local
```

[more environment examples](https://dotenvx.com/docs/quickstart/environments?utm_source=github&utm_medium=readme&utm_campaign=motdotla-dotenv&utm_content=docs-environments)

</details>
<details><summary>Production</summary><br>

Use [dotenvx](https://github.com/dotenvx/dotenvx) for production deploys.

Create a `.env.production` file.

```sh
$ echo "HELLO=production" > .env.production
```

Encrypt it.

```sh
$ dotenvx encrypt -f .env.production
```

Set `DOTENV_PRIVATE_KEY_PRODUCTION` (found in `.env.keys`) on your server.

```
$ heroku config:set DOTENV_PRIVATE_KEY_PRODUCTION=value
```

Commit your `.env.production` file to code and deploy.

```
$ git add .env.production
$ git commit -m "encrypted .env.production"
$ git push heroku main
```

Dotenvx will decrypt and inject the secrets at runtime using `dotenvx run -- node index.js`.

</details>
<details><summary>Syncing</summary><br>

Use [dotenvx](https://github.com/dotenvx/dotenvx) to sync your .env files.

Encrypt them with `dotenvx encrypt -f .env` and safely include them in source control. Your secrets are securely synced with your git.

This still subscribes to the twelve-factor app rules by generating a decryption key separate from code.

</details>
<details><summary>More Examples</summary><br>

See [examples](https://github.com/dotenv-org/examples) of using dotenv with various frameworks, languages, and configurations.

* [nodejs](https://github.com/dotenv-org/examples/tree/master/usage/dotenv-nodejs)
* [nodejs (debug on)](https://github.com/dotenv-org/examples/tree/master/usage/dotenv-nodejs-debug)
* [nodejs (override on)](https://github.com/dotenv-org/examples/tree/master/usage/dotenv-nodejs-override)
* [nodejs (processEnv override)](https://github.com/dotenv-org/examples/tree/master/usage/dotenv-custom-target)
* [esm](https://github.com/dotenv-org/examples/tree/master/usage/dotenv-esm)
* [typescript](https://github.com/dotenv-org/examples/tree/master/usage/dotenv-typescript)
* [typescript parse](https://github.com/dotenv-org/examples/tree/master/usage/dotenv-typescript-parse)
* [typescript config](https://github.com/dotenv-org/examples/tree/master/usage/dotenv-typescript-config)
* [webpack](https://github.com/dotenv-org/examples/tree/master/usage/dotenv-webpack)
* [webpack (plugin)](https://github.com/dotenv-org/examples/tree/master/usage/dotenv-webpack2)
* [react](https://github.com/dotenv-org/examples/tree/master/usage/dotenv-react)
* [react (typescript)](https://github.com/dotenv-org/examples/tree/master/usage/dotenv-react-typescript)
* [express](https://github.com/dotenv-org/examples/tree/master/usage/dotenv-express)
* [nestjs](https://github.com/dotenv-org/examples/tree/master/usage/dotenv-nestjs)
* [fastify](https://github.com/dotenv-org/examples/tree/master/usage/dotenv-fastify)

</details>

&nbsp;

## FAQ

<details><summary>Should I commit my `.env` file?</summary><br/>

No.

Unless you encrypt it with [dotenvx](https://github.com/dotenvx/dotenvx). Then we recommend you do.

</details>
<details><summary>What about variable expansion?</summary><br/>

Use [dotenvx](https://github.com/dotenvx/dotenvx).

</details>
<details><summary>Should I have multiple `.env` files?</summary><br/>

We recommend creating one `.env` file per environment. Use `.env` for local/development, `.env.production` for production and so on. This still follows the twelve factor principles as each is attributed individually to its own environment. Avoid custom set ups that work in inheritance somehow (`.env.production` inherits values from `.env` for example). It is better to duplicate values if necessary across each `.env.environment` file.

> In a twelve-factor app, env vars are granular controls, each fully orthogonal to other env vars. They are never grouped together as “environments”, but instead are independently managed for each deploy. This is a model that scales up smoothly as the app naturally expands into more deploys over its lifetime.
>
> – [The Twelve-Factor App](http://12factor.net/config)

Additionally, we recommend using [dotenvx](https://github.com/dotenvx/dotenvx) to encrypt and manage these.

</details>

<details><summary>How do I use dotenv with `import`?</summary><br/>

Import `dotenv/config` before modules that read environment variables.

```javascript
// index.mjs (ESM)
import 'dotenv/config'
import express from 'express'
```

This loads environment variables before the rest of your application modules are initialized. You can also use the CLI to inject them before Node starts:

```bash
dotenv run -- node index.mjs
```
</details>

<details><summary>Can I customize/write plugins for dotenv?</summary><br/>

Yes! `dotenv.config()` returns an object representing the parsed `.env` file. This gives you everything you need to continue setting values on `process.env`. For example:

```js
const dotenv = require('dotenv')
const variableExpansion = require('dotenv-expand')
const myEnv = dotenv.config()
variableExpansion(myEnv)
```

</details>
<details><summary>What rules does the parsing engine follow?</summary><br/>

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

</details>
<details><summary>What about syncing and securing .env files?</summary><br/>

Use [dotenvx](https://github.com/dotenvx/dotenvx) to unlock syncing encrypted .env files over git.

</details>
<details><summary>How do I specify config options with ES6 import?</summary><br/>

Pass options directly to `config()`.

```javascript
// index.mjs
import dotenv from 'dotenv'

dotenv.config({
  path: '/custom/path/to/.env',
  debug: true
})

import express from 'express'
```

If imported modules read environment variables during initialization, use a tiny wrapper file.

Create `load-env.mjs`:

```javascript
import dotenv from 'dotenv'
dotenv.config({ path: '/custom/path/to/.env', debug: true })
```

Then in your main file:

```javascript
import './load-env.mjs'
import express from 'express'
```

</details>
<details><summary>What if I accidentally commit my `.env` file to code?</summary><br/>

Remove it, [remove git history](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) and then install the [git pre-commit hook](https://github.com/dotenvx/dotenvx#pre-commit) to prevent this from ever happening again. 

```
npm i -g @dotenvx/dotenvx
dotenvx precommit --install
```

</details>

<details><summary>What happens to environment variables that were already set?</summary><br/>

By default, we will never modify any environment variables that have already been set. In particular, if there is a variable in your `.env` file which collides with one that already exists in your environment, then that variable will be skipped.

If instead, you want to override `process.env` use the `override` option.

```javascript
require('dotenv').config({ override: true })
```

</details>
<details><summary>How can I prevent committing my `.env` file to a Docker build?</summary><br/>

Use the [docker prebuild hook](https://dotenvx.com/docs/features/prebuild?utm_source=github&utm_medium=readme&utm_campaign=motdotla-dotenv&utm_content=docs-prebuild).

```bash
# Dockerfile
...
RUN curl -fsS https://dotenvx.sh/ | sh
...
RUN dotenvx prebuild
CMD ["dotenvx", "run", "--", "node", "index.js"]
```

</details>
<details><summary>How come my environment variables are not showing up for React?</summary><br/>

Your React code is run in Webpack, where the `fs` module or even the `process` global itself are not accessible out-of-the-box. `process.env` can only be injected through Webpack configuration.

If you are using [`react-scripts`](https://www.npmjs.com/package/react-scripts), which is distributed through [`create-react-app`](https://create-react-app.dev/), it has dotenv built in but with a quirk. Preface your environment variables with `REACT_APP_`. See [this stack overflow](https://stackoverflow.com/questions/42182577/is-it-possible-to-use-dotenv-in-a-react-project) for more details.

If you are using other frameworks (e.g. Next.js, Gatsby...), you need to consult their documentation for how to inject environment variables into the client.

</details>
<details><summary>Why is the `.env` file not loading my environment variables successfully?</summary><br/>

Most likely your `.env` file is not in the correct place. [See this stack overflow](https://stackoverflow.com/questions/42335016/dotenv-file-is-not-loading-environment-variables).

Turn on debug mode and try again..

```js
require('dotenv').config({ debug: true })
```

You will receive a helpful error outputted to your console.

</details>
<details><summary>Why am I getting the error `Module not found: Error: Can't resolve 'os|path'`?</summary><br/>

You are using dotenv on the front-end and have not included a polyfill. Webpack < 5 used to include these for you. Do the following:

```bash
npm install node-polyfill-webpack-plugin
```

Configure your `webpack.config.js` to something like the following.

```js
require('dotenv').config()

const path = require('path');
const webpack = require('webpack')

const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new NodePolyfillPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        HELLO: JSON.stringify(process.env.HELLO)
      }
    }),
  ]
};
```

Alternatively, just use [dotenv-webpack](https://github.com/mrsteele/dotenv-webpack) which does this and more behind the scenes for you.

</details>

&nbsp;

## Docs

Dotenv exposes four functions:

* `config`
* `parse`
* `populate`

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

##### path

Default: `path.resolve(process.cwd(), '.env')`

Specify a custom path if your file containing environment variables is located elsewhere.

```js
require('dotenv').config({ path: '/custom/path/to/.env' })
```
You can also pass a `URL` object:

```js
const fileUrl = new URL('file:///custom/path/to/.env')

require('dotenv').config({ path: fileUrl })
```

By default, `config` will look for a file called .env in the current working directory.

Pass in multiple files as an array, and they will be parsed in order and combined with `process.env` (or `option.processEnv`, if set). The first value set for a variable will win, unless the `options.override` flag is set, in which case the last value set will win.  If a value already exists in `process.env` and the `options.override` flag is NOT set, no changes will be made to that value. 

```js  
require('dotenv').config({ path: ['.env.local', '.env'] })
```

##### quiet

Default: `false`

Suppress runtime logging message.

```js
// index.js
require('dotenv').config({ quiet: false }) // change to true to suppress
console.log(`Hello ${process.env.HELLO}`)
```

```ini
# .env
HELLO=World
```

```sh
$ node index.js
Hello World
```

##### encoding

Default: `utf8`

Specify the encoding of your file containing environment variables.

```js
require('dotenv').config({ encoding: 'latin1' })
```

##### debug

Default: `false`

Turn on logging to help debug why certain keys or values are not being set as you expect.

```js
require('dotenv').config({ debug: process.env.DEBUG })
```

##### override

Default: `false`

Override any environment variables that have already been set on your machine with values from your .env file(s). If multiple files have been provided in `option.path` the override will also be used as each file is combined with the next. Without `override` being set, the first value wins. With `override` set the last value wins. 

```js
require('dotenv').config({ override: true })
```

##### processEnv

Default: `process.env`

Specify an object to write your environment variables to. Defaults to `process.env` environment variables.

```js
const myObject = {}
require('dotenv').config({ processEnv: myObject })

console.log(myObject) // values from .env
console.log(process.env) // this was not changed or written to
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

##### debug

Default: `false`

Turn on logging to help debug why certain keys or values are not being set as you expect.

```js
const dotenv = require('dotenv')
const buf = Buffer.from('hello world')
const opt = { debug: true }
const config = dotenv.parse(buf, opt)
// expect a debug message because the buffer is not in KEY=VAL form
```

### Populate

The engine which populates the contents of your .env file to `process.env` is available for use. It accepts a target, a source, and options. This is useful for power users who want to supply their own objects.

For example, customizing the source:

```js
const dotenv = require('dotenv')
const parsed = { HELLO: 'world' }

dotenv.populate(process.env, parsed)

console.log(process.env.HELLO) // world
```

For example, customizing the source AND target:

```js
const dotenv = require('dotenv')
const parsed = { HELLO: 'universe' }
const target = { HELLO: 'world' } // empty object

dotenv.populate(target, parsed, { override: true, debug: true })

console.log(target) // { HELLO: 'universe' }
```

#### options

##### Debug

Default: `false`

Turn on logging to help debug why certain keys or values are not being populated as you expect.

##### override

Default: `false`

Override any environment variables that have already been set.

&nbsp;

## CHANGELOG

See [CHANGELOG.md](CHANGELOG.md)

&nbsp;

## Who's using dotenv?

[These npm modules depend on it.](https://www.npmjs.com/browse/depended/dotenv)

Projects that expand it often use the [keyword "dotenv" on npm](https://www.npmjs.com/search?q=keywords:dotenv).
