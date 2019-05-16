const debug = require("debug")("dotenv:example");

console.log("process.env.DEBUG=", process.env.DEBUG);
debug("message from dotenv:example debug");
console.log("process.env.NODE_ENV=", process.env.NODE_ENV);
