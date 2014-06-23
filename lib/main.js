"use strict";

var package_json  = require('./../package.json');
var fs            = require('fs');

function dotenv() {
  dotenv = {
    version:          package_json.version,
    default_file_path:'./',
    keys_and_values:  {},
    environment: function() {
      return process.env.NODE_ENV || dotenv.keys_and_values["NODE_ENV"] || "development"
    },
    _loadEnv: function(filepath) {
      var path = (filepath || dotenv.default_file_path) + '.env';
      return dotenv._getKeysAndValuesFromEnvFilePath(path);
    },
    _loadEnvDotEnvironment: function(filepath) {
      var path = (filepath || dotenv.default_file_path) + '.env';
      return dotenv._getKeysAndValuesFromEnvFilePath(path+'.'+dotenv.environment());
    },
    _getKeyAndValueFromLine: function(line) {
      var key_value_array = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);

      if (!key_value_array) return null;

      var key             = key_value_array[1];
      var value           = key_value_array[2];

      if(typeof value === "undefined"){
        value = "";
      }

      if (value.charAt(0) === '"' && value.charAt(value.length-1) == '"') {
        value             = value.replace(/\\n/gm, "\n");
      }
      value               = value.replace(/['"]/gm, '');

      return [key, value];
    },
    _splitMultilineString: function ( lines ){
      var content;
      if(typeof lines !== 'string'){
        return [];
      }
      lines = lines.trim().split('\n');
      return lines.filter(function(line) { return line.trim().length; }); // remove any empty lines
    },
    _getKeysAndValuesFromEnvFilePath: function(filepath) {
      var data, content, lines;
      var keys_and_values = {};

      try {
        data    = fs.readFileSync(filepath);
      } catch (e) {
        return false;
      }
      
      keys_and_values = dotenv.parse( data );
      for( var key in keys_and_values ) {
        dotenv.keys_and_values[ key ] = keys_and_values[ key ];
      }

      return true;
    },
    _setEnvs: function() {
      Object.keys(dotenv.keys_and_values).forEach(function(key) {
        var value         = dotenv.keys_and_values[key];
        process.env[key]  = process.env[key] || value;
      });
    },
    parse : function(data) {
      var keys_and_values; 
      var payload = {};
      var lines = dotenv._splitMultilineString( data.toString() );
      keys_and_values = lines.map(dotenv._getKeyAndValueFromLine)
                             .filter(Array.isArray);

      keys_and_values.forEach(function(pair) {
          var key   = pair[0];
          var value = pair[1];
          payload[key] = value.trim();
      });
      return payload;
    },
    load: function(filepath) {
      dotenv._loadEnv(filepath);
      dotenv._loadEnvDotEnvironment(filepath);
      dotenv._setEnvs();

      return true;
    },
  };

  return dotenv;
}

module.exports = dotenv();
