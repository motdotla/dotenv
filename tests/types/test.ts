import { config, parse } from "dotenv";

const env = config();
const dbUrl: string | null =
  env.error || !env.parsed ? null : env.parsed["BASIC"];

config({
  path: ".env-example",
  encoding: "utf8",
  debug: true,
});

parse("test");

const parsed = parse("NODE_ENV=production\nDB_HOST=a.b.c");
const dbHost: string = parsed["DB_HOST"];

const parsedFromBuffer = parse(Buffer.from("JUSTICE=league\n"));
const justice: string = parsedFromBuffer["JUSTICE"];
