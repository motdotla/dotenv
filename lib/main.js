"use strict";

var fs               = require('fs'),
    DEFAULT_ENV_FILE = ".env",
    dotenv;

dotenv = (function() {
  function dotenv() {
    this.load(DEFAULT_ENV_FILE);
  }

  dotenv.prototype.load = function(envFile) {
    // load env file into array of lines
    var lines = fs.readFileSync(envFile).toString().trim().split('\n');

    for (var i=0; i<lines.length; i++) {
      // skip empty lines
      if (lines[i].trim().length > 0) {
        var key_value_array = lines[i].split("=");
        var key             = key_value_array[0].trim();
        var value           = key_value_array[1].trim();

        // expand \n to newline in double quotes
        if (value.charAt(0) === '"' && value.charAt(value.length-1) == '"') {
          value = value.replace(/\\n/gm, "\n");
        }

        // support quotes
        value = value.replace(/['"]/gm, '');

        // set for rest of the process to use
        process.env[key] = value;
      }
    }
  };

  return dotenv;

})();

module.exports = new dotenv();
