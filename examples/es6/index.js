// dotenv being imported as an ES6 module
// at this time, the latest node does not support this syntax
// therefore we'll preload babel's register function
// run this example by executing the "run_me" script: ./run_me

import dotenv from '../../lib/main'
dotenv.config()

console.log(process.env.ES6)
