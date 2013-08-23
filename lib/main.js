"use strict";

var package_json  = require('./../package.json');
var fs            = require('fs');

function dotenv() {
  dotenv = {
    version: package_json.version,
    environment: process.env.NODE_ENV || "development",

    _loadEnv: function() {
      return dotenv._setKeysAndValuesFromEnvFilePath(".env");
    },
    _loadEnvDotEnvironment: function() {
      return dotenv._setKeysAndValuesFromEnvFilePath(".env."+dotenv.environment);
    },
    _setKeysAndValuesFromEnvFilePath: function(filepath) {
      try {
        var data        = fs.readFileSync(filepath);
        var content     = data.toString().trim();
        var lines       = content.split('\n');

        for (var i=0; i<lines.length; i++) {
          var key_value_array = lines[i].split("=");
          var key             = key_value_array[0].trim();
          var value           = key_value_array[1].trim();

          if (value.charAt(0) === '"' && value.charAt(value.length-1) == '"') {
            value               = value.replace(/\\n/gm, "\n");
          }

          value               = value.replace(/['"]/gm, '');

          process.env[key]    = value;
        }
      } catch (e) {
      }

      return true;
    },
    load: function() {
      dotenv._loadEnvDotEnvironment();
      dotenv._loadEnv();

      return true;
    },
  };

  return dotenv;
}

module.exports = dotenv;
