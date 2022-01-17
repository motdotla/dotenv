// TypeScript Version: 3.0
/// <reference types="node" />

export interface DotenvParseOptions {
  /**
   * Turn on logging to help debug why certain keys or values are not being set as you expect.
   * Defaults to false.
   */
  debug?: boolean;

  /**
   * Override environment variables that have already been set on your machine with values from your .env file.
   * Defaults to false.
   */
  override?: boolean;
}

export interface DotenvParseOutput {
  [name: string]: string;
}

/**
 * Parses a string or buffer in the .env file format into an object.
 *
 * See https://docs.dotenv.org
 *
 * @param src - contents to be parsed. example: `'DB_HOST=localhost'`
 * @param options - additional options. example: `{ debug: true, override: false }`
 * @returns an object with keys and values based on `src`. example: `{ DB_HOST : 'localhost' }`
 */
export function parse<T extends DotenvParseOutput = DotenvParseOutput>(
  src: string | Buffer,
  options?: DotenvParseOptions
): T;

export interface DotenvConfigOptions {
  /**
   * Specify a custom path if your file containing environment variables is located elsewhere.
   */
  path?: string;

  /**
   * Specify the encoding of your file containing environment variables.
   */
  encoding?: string;

  /**
   * Turn on logging to help debug why certain keys or values are not being set as you expect.
   * Defaults to false.
   */
  debug?: boolean;

  /**
   * Override environment variables that have already been set on your machine with values from your .env file.
   * Defaults to false.
   */
  override?: boolean;
}

export interface DotenvConfigOutput {
  error?: Error;
  parsed?: DotenvParseOutput;
}

/**
 * Loads `.env` file contents into process.env.
 *
 * See https://docs.dotenv.org
 *
 * @param options - additional options. example: `{ path: './custom/path', encoding: 'latin1', debug: true, override: false }`
 * @returns an object with a `parsed` key if successful or `error` key if an error occurred. example: { parsed: { KEY: 'value' } }
 *
 */
export function config(options?: DotenvConfigOptions): DotenvConfigOutput;
