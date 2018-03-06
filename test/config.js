'use strict'

require('should')
var cp = require('child_process')
var Lab = require('lab')
var { experiment: describe, test: it } = exports.lab = Lab.script()
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
