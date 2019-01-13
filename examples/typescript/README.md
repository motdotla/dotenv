# TypeScript Example

> Use `dotenv` in a simple TypeScript project.

`src/lib/errors.ts` requires an environment variable at time of export so `src/lib/env.ts` contains `dotenv` configuration and is imported first in `src/index.ts`.

1. `npm install`
2. `npm run build`
3. `npm start`

Expected output:

```
Current NODE_ENV is example
Sample key is defined
```
