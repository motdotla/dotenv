import { config, parse } from "dotenv";

const env = config();
const dbUrl: string | null | undefined =
  env.error || !env.parsed ? null : env.parsed["BASIC"];

config({
  path: ".env-example",
  encoding: "utf8",
  debug: true,
});

parse("test");

const parsed = parse("NODE_ENV=production\nDB_HOST=a.b.c");
const dbHost: string | undefined = parsed["DB_HOST"];

const parsedFromBuffer = parse(new Buffer("JUSTICE=league\n"));
const justice: string | undefined = parsedFromBuffer["JUSTICE"];
