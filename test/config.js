'use strict'

require('should')
var cp = require('child_process')
var Lab = require('lab')
var lab = exports.lab = Lab.script()
var describe = lab.experiment
var it = lab.test
var nodeBinary = process.argv[0]

describe('config', function () {
  describe('preload', function () {
    it('loads .env', function (done) {
      cp.exec(
        '"' + nodeBinary + '" -r ../config -e "console.log(process.env.BASIC)" dotenv_config_path=./test/.env',
        function (err, stdout, stderr) {
          if (err) {
            return done(err)
          }

          stdout.trim().should.eql('basic')

          done()
        }
      )
    })
  })
})
