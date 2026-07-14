<a href="https://dotenvx.com/?utm_source=github&utm_medium=readme&utm_campaign=motdotla-dotenv&utm_content=banner"><img src="https://dotenvx.com/dotenv-banner.png" alt="dotenvx" /></a>

# dotenv [![NPM version](https://img.shields.io/npm/v/dotenv.svg?style=flat-square)](https://www.npmjs.com/package/dotenv) [![downloads](https://img.shields.io/npm/dw/dotenv)](https://www.npmjs.com/package/dotenv)

<img src="https://raw.githubusercontent.com/motdotla/dotenv/master/dotenv.svg" alt="dotenv" align="right" width="200" />

Dotenv es un módulo sin dependencias que carga variables de entorno desde un archivo `.env` en [`process.env`](https://nodejs.org/docs/latest/api/process.html#process_process_env). Guardar la configuración en el entorno, separada del código, se basa en la metodología de [The Twelve-Factor App](https://12factor.net/config).

[Ver el tutorial](https://www.youtube.com/watch?v=YtkZR0NFd1g)

&nbsp;

## Uso

Instálalo.

```sh
npm install dotenv --save
```

Crea un archivo `.env` en la raíz de tu proyecto:

```ini
# .env
S3_BUCKET="YOURS3BUCKET"
SECRET_KEY="YOURSECRETKEYGOESHERE"
```

Y lo antes posible en tu aplicación, importa y configura dotenv:

```javascript
// index.js
require('dotenv').config() // o import 'dotenv/config' si usas ES6
...
console.log(process.env) // elimínalo después de confirmar que funciona
```
```sh
$ node index.js
◇ injected env (14) from .env
```

Eso es todo. `process.env` ahora tiene las claves y valores que definiste en tu archivo `.env`.

&nbsp;

## Avanzado

<details><summary>ES6</summary><br>

Importa con [ES6](#como-uso-dotenv-con-import):

```javascript
import 'dotenv/config'
```

Import con ES6 si necesitas establecer opciones de configuración:

```javascript
import dotenv from 'dotenv'
dotenv.config({ path: '/custom/path/to/.env' })
```

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
<details><summary>Monorepos</summary><br>

Para monorepos con una estructura como `apps/backend/app.js`, coloca el archivo `.env` en la raíz de la carpeta donde corre tu proceso `app.js`.

```ini
# app/backend/.env
S3_BUCKET="YOURS3BUCKET"
SECRET_KEY="YOURSECRETKEYGOESHERE"
```

</details>
<details><summary>Valores Multilínea</summary><br>

Si necesitas variables multilínea, por ejemplo claves privadas, ya son compatibles (`>= v15.0.0`) con saltos de línea:

```ini
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
...
Kh9NV...
...
-----END RSA PRIVATE KEY-----"
```

Como alternativa, puedes usar comillas dobles y el carácter `\n`:

```ini
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nKh9NV...\n-----END RSA PRIVATE KEY-----\n"
```

</details>
<details><summary>Comentarios</summary><br>

Puedes agregar comentarios en su propia línea o al final de una línea:

```ini
# Este es un comentario
SECRET_KEY=YOURSECRETKEYGOESHERE # comentario
SECRET_HASH="something-with-a-#-hash"
```

Los comentarios empiezan donde aparece `#`, así que si tu valor contiene `#` debes envolverlo entre comillas. Este es un cambio incompatible desde `>= v15.0.0`.

</details>
<details><summary>Análisis</summary><br>

El motor que analiza el contenido del archivo de variables de entorno está disponible para su uso. Acepta un String o Buffer y devuelve un objeto con las claves y valores analizados.

```javascript
const dotenv = require('dotenv')
const buf = Buffer.from('BASIC=basic')
const config = dotenv.parse(buf) // devolverá un objeto
console.log(typeof config, config) // objeto { BASIC : 'basic' }
```

</details>
<details><summary>Precarga</summary><br>

> Nota: considera usar [`dotenvx`](https://github.com/dotenvx/dotenvx) en lugar de precargar. Ahora lo hago (y lo recomiendo).
>
> Cumple el mismo propósito (no necesitas hacer require y cargar dotenv), agrega mejor depuración y funciona con CUALQUIER lenguaje, framework o plataforma. – [motdotla](https://not.la)

Puedes usar la [opción de línea de comandos](https://nodejs.org/api/cli.html#-r---require-module) `--require` (`-r`) para precargar dotenv. Con esto no necesitas requerir ni cargar dotenv en el código de tu aplicación.

```bash
$ node -r dotenv/config your_script.js
```

Las opciones de configuración de abajo se aceptan como argumentos de línea de comandos en el formato `dotenv_config_<option>=value`

```bash
$ node -r dotenv/config your_script.js dotenv_config_path=/custom/path/to/.env dotenv_config_debug=true
```

Además, puedes usar variables de entorno para establecer opciones de configuración. Los argumentos de línea de comandos tienen prioridad.

```bash
$ DOTENV_CONFIG_<OPTION>=value node -r dotenv/config your_script.js
```

```bash
$ DOTENV_CONFIG_ENCODING=latin1 DOTENV_CONFIG_DEBUG=true node -r dotenv/config your_script.js dotenv_config_path=/custom/path/to/.env
```

</details>
<details><summary>Expansión de Variables</summary><br>

Usa [dotenvx](https://github.com/dotenvx/dotenvx) para expansión de variables.

Referencia y expande variables que ya existen en tu máquina para usarlas en tu archivo .env.

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
<details><summary>Sustitución de Comandos</summary><br>

Usa [dotenvx](https://github.com/dotenvx/dotenvx) para sustitución de comandos.

Agrega la salida de un comando a una de tus variables en tu archivo .env.

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
<details><summary>Cifrado</summary><br>

Usa [dotenvx](https://github.com/dotenvx/dotenvx) para cifrado.

Agrega cifrado a tus archivos `.env` con un solo comando.

```
$ dotenvx set HELLO Production -f .env.production
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ DOTENV_PRIVATE_KEY_PRODUCTION="<.env.production private key>" dotenvx run -- node index.js
⟐ injected env (2) from .env.production · dotenvx@1.59.1
Hello Production
```

[más información](https://github.com/dotenvx/dotenvx?tab=readme-ov-file#encryption)

</details>
<details><summary>Múltiples Entornos</summary><br>

Usa [dotenvx](https://github.com/dotenvx/dotenvx) para administrar múltiples entornos.

Ejecuta cualquier entorno localmente. Crea un archivo `.env.ENVIRONMENT` y usa `-f` para cargarlo. Es simple y flexible.

```bash
$ echo "HELLO=production" > .env.production
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ dotenvx run -f=.env.production -- node index.js
Hello production
> ^^
```

o con múltiples archivos .env

```bash
$ echo "HELLO=local" > .env.local
$ echo "HELLO=World" > .env
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ dotenvx run -f=.env.local -f=.env -- node index.js
Hello local
```

[más ejemplos de entornos](https://dotenvx.com/docs/quickstart/environments?utm_source=github&utm_medium=readme&utm_campaign=motdotla-dotenv&utm_content=docs-environments)

</details>
<details><summary>Producción</summary><br>

Usa [dotenvx](https://github.com/dotenvx/dotenvx) para despliegues en producción.

Crea un archivo `.env.production`.

```sh
$ echo "HELLO=production" > .env.production
```

Cífralo.

```sh
$ dotenvx encrypt -f .env.production
```

Configura `DOTENV_PRIVATE_KEY_PRODUCTION` (está en `.env.keys`) en tu servidor.

```
$ heroku config:set DOTENV_PRIVATE_KEY_PRODUCTION=value
```

Haz commit de tu archivo `.env.production` y despliega.

```
$ git add .env.production
$ git commit -m "encrypted .env.production"
$ git push heroku main
```

Dotenvx descifrará e inyectará los secretos en runtime usando `dotenvx run -- node index.js`.

</details>
<details><summary>Sincronización</summary><br>

Usa [dotenvx](https://github.com/dotenvx/dotenvx) para sincronizar tus archivos .env.

Cífralos con `dotenvx encrypt -f .env` e inclúyelos de forma segura en el control de código fuente. Tus secretos se sincronizan de forma segura con git.

Esto sigue las reglas de Twelve-Factor App al generar una clave de descifrado separada del código.

</details>
<details><summary>Más Ejemplos</summary><br>

Mira [ejemplos](https://github.com/dotenv-org/examples) de uso de dotenv con distintos frameworks, lenguajes y configuraciones.

* [nodejs](https://github.com/dotenv-org/examples/tree/master/usage/dotenv-nodejs)
* [nodejs (debug on)](https://github.com/dotenv-org/examples/tree/master/usage/dotenv-nodejs-debug)
* [nodejs (override on)](https://github.com/dotenv-org/examples/tree/master/usage/dotenv-nodejs-override)
* [nodejs (processEnv override)](https://github.com/dotenv-org/examples/tree/master/usage/dotenv-custom-target)
* [esm](https://github.com/dotenv-org/examples/tree/master/usage/dotenv-esm)
* [esm (preload)](https://github.com/dotenv-org/examples/tree/master/usage/dotenv-esm-preload)
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

## Preguntas Frecuentes

<details><summary>¿Debo hacer commit de mi archivo `.env`?</summary><br/>

No.

A menos que lo cifres con [dotenvx](https://github.com/dotenvx/dotenvx). En ese caso sí lo recomendamos.

</details>
<details><summary>¿Qué pasa con la expansión de variables?</summary><br/>

Usa [dotenvx](https://github.com/dotenvx/dotenvx).

</details>
<details><summary>¿Debo tener múltiples archivos `.env`?</summary><br/>

Recomendamos crear un archivo `.env` por entorno. Usa `.env` para local/desarrollo, `.env.production` para producción, etc. Esto sigue los principios de Twelve-Factor porque cada uno pertenece de forma independiente a su entorno. Evita configuraciones personalizadas con herencia (`.env.production` hereda valores de `.env`, por ejemplo). Es mejor duplicar valores cuando sea necesario en cada archivo `.env.environment`.

> En una app twelve-factor, las variables de entorno son controles granulares, totalmente ortogonales entre sí. Nunca se agrupan como “entornos”; en cambio, se administran de forma independiente por despliegue. Este modelo escala de forma natural a medida que la app crece en más despliegues a lo largo del tiempo.
>
> – [The Twelve-Factor App](http://12factor.net/config)

Además, recomendamos usar [dotenvx](https://github.com/dotenvx/dotenvx) para cifrarlos y administrarlos.

</details>

<details><summary>¿Cómo uso dotenv con `import`?</summary><br/>

Simplemente..

```javascript
// index.mjs (ESM)
import 'dotenv/config' // ver https://github.com/motdotla/dotenv#como-uso-dotenv-con-import
import express from 'express'
```

Un poco de contexto..

> Cuando ejecutas un módulo que contiene una declaración `import`, primero se cargan los módulos importados y luego se ejecuta cada cuerpo de módulo en un recorrido en profundidad del grafo de dependencias, evitando ciclos al omitir lo que ya se ejecutó.
>
> – [ES6 In Depth: Modules](https://hacks.mozilla.org/2015/08/es6-in-depth-modules/)

¿Qué significa esto en lenguaje simple? Que parece que lo siguiente debería funcionar, pero no funciona.

`errorReporter.mjs`:
```js
class Client {
  constructor (apiKey) {
    console.log('apiKey', apiKey)

    this.apiKey = apiKey
  }
}

export default new Client(process.env.API_KEY)
```
`index.mjs`:
```js
// Nota: esto es INCORRECTO y no funcionará
import * as dotenv from 'dotenv'
dotenv.config()

import errorReporter from './errorReporter.mjs' // process.env.API_KEY estará vacío
```

`process.env.API_KEY` estará vacío.

En su lugar, `index.mjs` debería escribirse así..

```js
import 'dotenv/config'

import errorReporter from './errorReporter.mjs'
```

¿Tiene sentido? Es un poco poco intuitivo, pero así funciona la importación de módulos ES6. Aquí tienes un [ejemplo funcional de este problema](https://github.com/dotenv-org/examples/tree/master/usage/dotenv-es6-import-pitfall).

Hay dos alternativas a este enfoque:

1. Precargar con dotenvx: `dotenvx run -- node index.js` (_Nota: con este enfoque no necesitas `import` dotenv_)
2. Crear un archivo separado que ejecute `config` primero, como se indica en [este comentario de #133](https://github.com/motdotla/dotenv/issues/133#issuecomment-255298822)
</details>

<details><summary>¿Puedo personalizar/escribir plugins para dotenv?</summary><br/>

Sí. `dotenv.config()` devuelve un objeto que representa el archivo `.env` analizado. Con eso tienes lo necesario para seguir estableciendo valores en `process.env`. Por ejemplo:

```js
const dotenv = require('dotenv')
const variableExpansion = require('dotenv-expand')
const myEnv = dotenv.config()
variableExpansion(myEnv)
```

</details>
<details><summary>¿Qué reglas sigue el motor de análisis?</summary><br/>

El motor de análisis actualmente soporta las siguientes reglas:

- `BASIC=basic` se convierte en `{BASIC: 'basic'}`
- las líneas vacías se omiten
- las líneas que empiezan con `#` se tratan como comentarios
- `#` marca el inicio de un comentario (a menos que el valor esté entre comillas)
- los valores vacíos se convierten en cadenas vacías (`EMPTY=` pasa a `{EMPTY: ''}`)
- las comillas internas se conservan (piensa en JSON) (`JSON={"foo": "bar"}` se convierte en `{JSON:"{\"foo\": \"bar\"}"`)
- se elimina el espacio al principio y al final de valores sin comillas (más en [`trim`](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/String/trim)) (`FOO=  some value  ` pasa a `{FOO: 'some value'}`)
- los valores con comillas simples o dobles se escapan (`SINGLE_QUOTE='quoted'` pasa a `{SINGLE_QUOTE: "quoted"}`)
- los valores entre comillas simples o dobles mantienen los espacios en ambos extremos (`FOO="  some value  "` pasa a `{FOO: '  some value  '}`)
- los valores entre comillas dobles expanden saltos de línea (`MULTILINE="new\nline"` pasa a

```
{MULTILINE: 'new
line'}
```

- se admiten backticks (`` BACKTICK_KEY=`This has 'single' and "double" quotes inside of it.` ``)

</details>
<details><summary>¿Qué hay de sincronizar y proteger archivos .env?</summary><br/>

Usa [dotenvx](https://github.com/dotenvx/dotenvx) para habilitar la sincronización de archivos .env cifrados sobre git.

</details>
<details><summary>¿Qué pasa si hago commit accidentalmente de mi archivo `.env`?</summary><br/>

Elimínalo, [borra el historial de git](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) y luego instala el [hook de pre-commit de git](https://github.com/dotenvx/dotenvx#pre-commit) para evitar que vuelva a pasar. 

```
npm i -g @dotenvx/dotenvx
dotenvx precommit --install
```

</details>
<details><summary>¿Qué pasa con variables de entorno que ya estaban definidas?</summary><br/>

Por defecto, nunca modificamos variables de entorno que ya estén definidas. En particular, si hay una variable en tu archivo `.env` que colisiona con una ya existente en tu entorno, esa variable se omite.

Si en cambio quieres sobrescribir `process.env`, usa la opción `override`.

```javascript
require('dotenv').config({ override: true })
```

</details>
<details><summary>¿Cómo evito incluir mi archivo `.env` en un build de Docker?</summary><br/>

Usa el [hook de prebuild para docker](https://dotenvx.com/docs/features/prebuild?utm_source=github&utm_medium=readme&utm_campaign=motdotla-dotenv&utm_content=docs-prebuild).

```bash
# Dockerfile
...
RUN curl -fsS https://dotenvx.sh/ | sh
...
RUN dotenvx prebuild
CMD ["dotenvx", "run", "--", "node", "index.js"]
```

</details>
<details><summary>¿Por qué no aparecen mis variables de entorno en React?</summary><br/>

Tu código React corre en Webpack, donde el módulo `fs` o incluso el global `process` no son accesibles de forma predeterminada. `process.env` solo se puede inyectar mediante configuración de Webpack.

Si usas [`react-scripts`](https://www.npmjs.com/package/react-scripts), distribuido vía [`create-react-app`](https://create-react-app.dev/), ya incluye dotenv, pero con una condición. Antepone `REACT_APP_` a tus variables de entorno. Mira [este stack overflow](https://stackoverflow.com/questions/42182577/is-it-possible-to-use-dotenv-in-a-react-project) para más detalles.

Si usas otros frameworks (por ejemplo, Next.js, Gatsby...), debes revisar su documentación para inyectar variables de entorno en el cliente.

</details>
<details><summary>¿Por qué el archivo `.env` no carga mis variables de entorno correctamente?</summary><br/>

Lo más probable es que tu archivo `.env` no esté en el lugar correcto. [Mira este stack overflow](https://stackoverflow.com/questions/42335016/dotenv-file-is-not-loading-environment-variables).

Activa el modo debug y prueba de nuevo..

```js
require('dotenv').config({ debug: true })
```

Recibirás un error útil en la consola.

</details>
<details><summary>¿Por qué recibo el error `Module not found: Error: Can't resolve 'crypto|os|path'`?</summary><br/>

Estás usando dotenv en el front-end y no incluiste un polyfill. Webpack < 5 solía incluirlos. Haz lo siguiente:

```bash
npm install node-polyfill-webpack-plugin
```

Configura tu `webpack.config.js` con algo como lo siguiente.

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

Como alternativa, usa [dotenv-webpack](https://github.com/mrsteele/dotenv-webpack), que hace esto y más por detrás.

</details>

&nbsp;

## Documentación

Dotenv expone tres funciones:

* `config`
* `parse`
* `populate`

### Config

`config` leerá tu archivo `.env`, analizará su contenido, lo asignará a
[`process.env`](https://nodejs.org/docs/latest/api/process.html#process_process_env),
y devolverá un objeto con una clave `parsed` con el contenido cargado o una clave `error` si falla.

```js
const result = dotenv.config()

if (result.error) {
  throw result.error
}

console.log(result.parsed)
```

También puedes pasar opciones a `config`.

#### Opciones

##### path

Por defecto: `path.resolve(process.cwd(), '.env')`

Especifica una ruta personalizada si tu archivo de variables de entorno está en otro lugar.

```js
require('dotenv').config({ path: '/custom/path/to/.env' })
```

Por defecto, `config` buscará un archivo llamado .env en el directorio de trabajo actual.

Pasa múltiples archivos como un arreglo; se analizarán en orden y se combinarán con `process.env` (o `option.processEnv`, si se define). El primer valor asignado a una variable prevalece, salvo que `options.override` esté activo; en ese caso prevalece el último. Si un valor ya existe en `process.env` y `options.override` NO está activo, no se hará ningún cambio en ese valor. 

```js  
require('dotenv').config({ path: ['.env.local', '.env'] })
```

##### quiet

Por defecto: `false`

Suprime el mensaje de logging en tiempo de ejecución.

```js
// index.js
require('dotenv').config({ quiet: false }) // cambia a true para suprimir
console.log(`Hello ${process.env.HELLO}`)
```

```ini
# .env
HELLO=World
```

```sh
$ node index.js
Hola Mundo
```

##### encoding

Por defecto: `utf8`

Especifica la codificación del archivo que contiene variables de entorno.

```js
require('dotenv').config({ encoding: 'latin1' })
```

##### debug

Por defecto: `false`

Activa logs para depurar por qué ciertas claves o valores no se establecen como esperas.

```js
require('dotenv').config({ debug: process.env.DEBUG })
```

##### override

Por defecto: `false`

Sobrescribe cualquier variable de entorno ya definida en tu máquina con valores de tus archivos .env. Si se proporcionan múltiples archivos en `option.path`, `override` también aplica al combinar cada archivo con el siguiente. Sin `override`, prevalece el primer valor. Con `override`, prevalece el último. 

```js
require('dotenv').config({ override: true })
```

##### processEnv

Por defecto: `process.env`

Especifica un objeto donde escribir tus variables de entorno. Por defecto usa `process.env`.

```js
const myObject = {}
require('dotenv').config({ processEnv: myObject })

console.log(myObject) // valores desde .env
console.log(process.env) // esto no se modificó ni escribió
```

### Parse

El motor que analiza el contenido de tu archivo de variables
de entorno está disponible para usar. Acepta un String o Buffer y devuelve
un objeto con las claves y valores analizados.

```js
const dotenv = require('dotenv')
const buf = Buffer.from('BASIC=basic')
const config = dotenv.parse(buf) // devolverá un objeto
console.log(typeof config, config) // objeto { BASIC : 'basic' }
```

#### Opciones

##### debug

Por defecto: `false`

Activa logs para depurar por qué ciertas claves o valores no se establecen como esperas.

```js
const dotenv = require('dotenv')
const buf = Buffer.from('hola mundo')
const opt = { debug: true }
const config = dotenv.parse(buf, opt)
// espera un mensaje de depuración porque el buffer no tiene formato KEY=VAL
```

### Populate

El motor que carga el contenido de tu archivo .env en `process.env` está disponible para su uso. Acepta un objetivo, una fuente y opciones. Es útil para usuarios avanzados que quieren proveer sus propios objetos.

Por ejemplo, personalizando la fuente:

```js
const dotenv = require('dotenv')
const parsed = { HELLO: 'world' }

dotenv.populate(process.env, parsed)

console.log(process.env.HELLO) // world
```

Por ejemplo, personalizando la fuente Y el objetivo:

```js
const dotenv = require('dotenv')
const parsed = { HELLO: 'universe' }
const target = { HELLO: 'world' } // objeto inicial

dotenv.populate(target, parsed, { override: true, debug: true })

console.log(target) // { HELLO: 'universe' }
```

#### opciones

##### Debug

Por defecto: `false`

Activa logs para depurar por qué ciertas claves o valores no se están cargando como esperas.

##### override

Por defecto: `false`

Sobrescribe cualquier variable de entorno que ya haya sido definida.

&nbsp;

## CHANGELOG

Ver [CHANGELOG.md](CHANGELOG.md)

&nbsp;

## ¿Quién usa dotenv?

[Estos módulos de npm dependen de él.](https://www.npmjs.com/browse/depended/dotenv)

Los proyectos que lo extienden suelen usar la [palabra clave "dotenv" en npm](https://www.npmjs.com/search?q=keywords:dotenv).
