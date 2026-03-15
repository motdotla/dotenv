import { config, configDotenv, parse, populate, decrypt, DotenvPopulateOutput } from "dotenv";

const env = config();
const dbUrl: string | null =
  env.error || !env.parsed ? null : env.parsed["BASIC"];

config({
  path: ".env-example",
  encoding: "utf8",
  debug: true,
});

// config accepts array of paths
config({
  path: [".env.local", ".env"],
});

// config accepts override option
config({
  override: true,
});

// config accepts quiet option
config({
  quiet: true,
});

// config accepts DOTENV_KEY option
config({
  DOTENV_KEY: "dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=production",
});

parse("test");

const parsed = parse("NODE_ENV=production\nDB_HOST=a.b.c");
const dbHost: string = parsed["DB_HOST"];

const parsedFromBuffer = parse(Buffer.from("JUSTICE=league\n"));
const justice: string = parsedFromBuffer["JUSTICE"];

config({
  // make sure the type accepts process.env (it didn't in the past)
  processEnv: process.env,
});

// configDotenv works same as config
const envDotenv = configDotenv();
const dbUrl2: string | null =
  envDotenv.error || !envDotenv.parsed ? null : envDotenv.parsed["BASIC"];

configDotenv({
  path: ".env",
  encoding: "utf8",
  debug: true,
  override: true,
  quiet: true,
});

// populate accepts target and source objects
const target: { [name: string]: string } = {};
const source: { [name: string]: string } = { KEY: "value" };
const populateResult: DotenvPopulateOutput = populate(target, source);
const populatedValue: string = populateResult["KEY"];

// populate accepts options
populate(target, source, { debug: true, override: true });

// populate works with process.env
populate(process.env, { HELLO: "world" });

// decrypt returns a string
const decrypted: string = decrypt(
  "s7NYXa809k/bVSPwIAmJhPJmEGTtU0hG58hOZy7I0ix6y5HP8LsHBsZCYC/gw5DDFy5DgOcyd18R",
  "ddcaa26504cd70a6fef9801901c3981538563a1767c297cb8416e8a38c62fe00"
);
