"use strict";

var package_json  = require('./../package.json');
var fs            = require('fs');
var path          = require('path')

function dotenv() {
  dotenv = {
    version:          package_json.version,
    environment:      process.env.NODE_ENV || "development",
    keys_and_values:  {},

    _loadEnv: function(file, directory) {
      return dotenv._getKeysAndValuesFromEnvFilePath(path.resolve(directory, file || ".env"));
    },
    _loadEnvDotEnvironment: function(file, directory) {
      return dotenv._getKeysAndValuesFromEnvFilePath(path.resolve(directory, (file || ".env") + '.' + dotenv.environment));
    },
    _getKeyAndValueFromLine: function(line) {
      var key_value_array = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);

      if (!key_value_array) return null;

      var key             = key_value_array[1];
      var value           = key_value_array[2];

      if (value.charAt(0) === '"' && value.charAt(value.length-1) == '"') {
        value             = value.replace(/\\n/gm, "\n");
      }
      value               = value.replace(/['"]/gm, '');

      return [key, value];
    },
    _getKeysAndValuesFromEnvFilePath: function(filepath) {
      var data, content, lines, keys_and_values;

      try {
        data        = fs.readFileSync(filepath);
        content     = data.toString().trim();
        lines       = content.split('\n');
        lines       = lines.filter(function(line) { return line.trim().length; }); // remove any empty lines
      } catch (e) {
        return false;
      }

      keys_and_values = lines.map(dotenv._getKeyAndValueFromLine)
                             .filter(Array.isArray);

      keys_and_values.forEach(function(pair) {
          var key   = pair[0];
          var value = pair[1];

          dotenv.keys_and_values[key] = value;
      })

      return true;
    },
    _setEnvs: function() {
      Object.keys(dotenv.keys_and_values).forEach(function(key) {
        var value         = dotenv.keys_and_values[key];
        process.env[key]  = process.env[key] || value;
      });
    },
    load: function(options) {
      var options           = (typeof options !== 'function') && options || {};
          options.file      = options.file || null;
          options.directory = options.directory ? path.normalize(options.directory || options.dir) : "";

      dotenv._loadEnv(options.file, options.directory);
      dotenv._loadEnvDotEnvironment(options.file, options.directory);
      dotenv._setEnvs();

      return true;
    },
  };

  return dotenv;
}

module.exports = dotenv();
