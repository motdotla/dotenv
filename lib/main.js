"use strict";

var package_json = require('./../package.json');
var fs = require('fs');

var EXTRACT_VAR_REGEX = /\$\{\s*([^|}]+?)\s*(?:\|([^}]*))?\s*\}/g;

var dotenv = {
  version: package_json.version,
  keys_and_values: {},
  environment: function () {
    return process.env.NODE_ENV || dotenv.keys_and_values.NODE_ENV || "development";
  },
  _loadEnv: function () {
    return dotenv._getKeysAndValuesFromEnvFilePath(".env");
  },
  _loadEnvDotEnvironment: function () {
    return dotenv._getKeysAndValuesFromEnvFilePath(".env." + dotenv.environment());
  },
  _getKeyAndValueFromLine: function (line) {
    var key_value_array = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);

    if (!key_value_array) {
      return null;
    }

    var key = key_value_array[1];
    var value = key_value_array[2];

    if (typeof value === "undefined") {
      value = "";
    }

    if (value.charAt(0) === '"' && value.charAt(value.length - 1) == '"') {
      value = value.replace(/\\n/gm, "\n");
    }
    value = value.replace(/(^['"]|['"]$)/g, ''); // replace first and last quotes only

    return [key, value];
  },
  _splitMultilineString: function (lines) {
    if (typeof lines !== 'string') {
      return [];
    }
    lines = lines.trim().split('\n');
    return lines.filter(function (line) {
      return line.trim().length;
    }); // remove any empty lines
  },
  _processInValueVariables: function (value) {
    var after;

    if (value.indexOf('${') > -1) {
      after = value.replace(EXTRACT_VAR_REGEX, function (match, key) {
        var result = dotenv.keys_and_values[key] || process.env[key] || '';
        return dotenv._processInValueVariables(result);
     });
    }

    return after || value;
  },
  _processForPotentialEnvVariable: function (value) {
    // variable in value starts with a $
    if (value.charAt(0) === '$') {
      var substringed_value = value.substring(1);
      value = dotenv.keys_and_values[substringed_value] || process.env[substringed_value] || '';
    }
    // varaible can be escaped with a \$
    if (value.substring(0, 2) === "\\$") {
      value = value.substring(1);
    }

    value = dotenv._processInValueVariables(value);

    return value;
  },
  _getKeysAndValuesFromEnvFilePath: function (filepath) {
    var data;

    try {
      data = fs.readFileSync(filepath);
    } catch (e) {
      return false;
    }

    var keys_and_values = dotenv.parse(data);

    // pre-populate the list before variable replacement so that recursive
    // substitutions are possible.
    for (var i in keys_and_values) {
      dotenv.keys_and_values[i] = keys_and_values[i];
    }

    for (var key in keys_and_values) {
      var value = dotenv.keys_and_values[key];
      value = dotenv._processForPotentialEnvVariable(value);
      dotenv.keys_and_values[key] = value;
    }

    return true;
  },
  _setEnvs: function () {
    Object.keys(dotenv.keys_and_values).forEach(function (key) {
      var value = dotenv.keys_and_values[key];

      process.env[key] = process.env[key] || value;
    });
  },
  parse: function (data) {
    var keys_and_values;
    var payload = {};
    var lines = dotenv._splitMultilineString(data.toString());
    keys_and_values = lines.map(dotenv._getKeyAndValueFromLine)
      .filter(Array.isArray);

    keys_and_values.forEach(function (pair) {
      var key = pair[0];
      var value = pair[1];
      payload[key] = value.trim();
    });
    return payload;
  },
  load: function () {
    dotenv.keys_and_values = {};
    dotenv._loadEnv();
    dotenv._loadEnvDotEnvironment();
    dotenv._setEnvs();

    return true;
  },
};

module.exports = dotenv;
