import { config, parse, populate, DotenvPopulateInput } from "dotenv";

const env = config();
const dbUrl: string | null =
  env.error || !env.parsed ? null : env.parsed["BASIC"];

config({
  path: ".env-example",
  encoding: "utf8",
  debug: true,
});

parse("test");
parse("test", { fast: true });

const parsed = parse("NODE_ENV=production\nDB_HOST=a.b.c");
const dbHost: string = parsed["DB_HOST"];

const parsedFromBuffer = parse(Buffer.from("JUSTICE=league\n"));
const justice: string = parsedFromBuffer["JUSTICE"];

config({
  // make sure the type accepts process.env (it didn't in the past)
  processEnv: process.env,
});

config({
  secure: true,
  fast: true,
});

// populate() should accept DotenvPopulateOptions (debug + override only),
// not the broader DotenvConfigOptions
const target: DotenvPopulateInput = {};
populate(target, { DB_HOST: "localhost" });
populate(target, { DB_HOST: "localhost" }, { debug: true });
populate(target, { DB_HOST: "localhost" }, { override: true });
populate(target, { DB_HOST: "localhost" }, { debug: true, override: false });
