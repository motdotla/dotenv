"use strict";

var package_json  = require('./../package.json');
var fs            = require('fs');


function dotenv() {

  dotenv = {
    version:          package_json.version,

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

      var values = {};
      for (var i=0; i<lines.length; i++) {
        try {
          var pair = dotenv._getKeyAndValueFromLine(lines[i]);
          var key   = pair[0];
          var value = pair[1];

          values[key] = value;
        } catch (e) {
        }
      }

      return values;
    },
    _setEnv: function(vals) {
      Object.keys(vals).forEach(function(key) {
        var value         = vals[key];
        process.env[key]  = dotenv.originalEnv[key] || value;
      });
    },
    reset: function() {
      if (dotenv.originalEnv) {
        process.env = dotenv.originalEnv;
        delete dotenv.originalEnv;
      }
    },
    load: function(filepath) {
      dotenv.originalEnv = dotenv.originalEnv || JSON.parse(JSON.stringify(process.env));

      if (!filepath) {
        var defaultVals = dotenv.load(".env"),
            overrideVals = false;

        if (process.env.NODE_ENV) {
          overrideVals = dotenv.load(".env."+process.env.NODE_ENV);
        }

        return defaultVals || overrideVals;
      }

      var vals = dotenv._getKeysAndValuesFromEnvFilePath(filepath);
      if (vals) {
        dotenv._setEnv(vals);
      }
      return !!vals;
    }
  };

  return {
    version: dotenv.version,
    load: dotenv.load,
    reset: dotenv.reset
  };
}

module.exports = dotenv();
