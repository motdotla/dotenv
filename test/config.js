'use strict'

require('should')
var cp = require('child_process')
var lab = exports.lab = Lab.script()
var describe = lab.experiment
var it = lab.test
var nodeBinary = process.argv[0]

describe('config', () => {
  describe('preload', () => {
    it('loads .env', done => {
      // NB: `nodeBinary` is quoted for Windows
      cp.exec(
        '"' + nodeBinary + '" -r ../config -e "console.log(process.env.BASIC)" dotenv_config_path=./test/.env',
        (err, stdout, stderr) => {
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
