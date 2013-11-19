"use strict";

var package_json  = require('./../package.json');
var fs            = require('fs');

function dotenv() {
  dotenv = {
    version:          package_json.version,
    environment:      process.env.NODE_ENV || "development",
    keys_and_values:  {},

    _loadEnv: function() {
      return dotenv._getKeysAndValuesFromEnvFilePath(".env");
    },
    _loadEnvDotEnvironment: function() {
      return dotenv._getKeysAndValuesFromEnvFilePath(".env."+dotenv.environment);
    },
    _getKeyAndValueFromLine: function(line) {
      var key_value_array = line.match(/^\s*([\w\.\-\_]+)\s*=\s*(.*?)\s*$/);
      var key             = key_value_array[1].trim();
      var value           = key_value_array[2].trim();

      if (value.charAt(0) === '"' && value.charAt(value.length-1) == '"') {
        value             = value.replace(/\\n/gm, "\n");
      }
      value               = value.replace(/['"]/gm, '');

      return [key, value];
    },
    _getKeysAndValuesFromEnvFilePath: function(filepath) {
      var data, content, lines;
      try {
        data        = fs.readFileSync(filepath);
        content     = data.toString().trim();
        lines       = content.split('\n');
        lines       = lines.filter(function(line) { return line.trim().length; }); // remove any empty lines
      } catch (e) {
        return false;
      }

      for (var i=0; i<lines.length; i++) {
        try {
          var array = dotenv._getKeyAndValueFromLine(lines[i]);
          var key   = array[0];
          var value = array[1];

          dotenv.keys_and_values[key] = value;
        } catch (e) {
        }

      }

      return true;
    },
    _setEnvs: function() {
      Object.keys(dotenv.keys_and_values).forEach(function(key) {
        var value         = dotenv.keys_and_values[key];
        process.env[key]  = process.env[key] || value;
      });
    },
    load: function() {
      dotenv._loadEnv();
      dotenv._loadEnvDotEnvironment();
      dotenv._setEnvs();

      return true;
    },
  };

  return dotenv;
}

module.exports = dotenv();
