import "./lib/env"
import errorReporter from "./lib/errors"

console.log(`Current NODE_ENV is ${process.env.NODE_ENV}`)

console.log(`Sample key is ${process.env.SAMPLE_KEY}`)

errorReporter.report(new Error("example"))
