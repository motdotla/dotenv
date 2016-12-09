// dotenv invoked via preload command line argument along with babel
// e.g. node -r babel/register -r dotenv/config index.js
// run this example by executing the "run_me" script: ./run_me

import { uptime } from 'os'

console.log(process.env.ES6PRELOAD)
console.log(`Your computer has been up for ${Math.floor(uptime() / 60 / 60 / 24)} days`)
