'use strict'

var should = require('should')
var Lab = require('lab')
var lab = exports.lab = Lab.script()
var describe = lab.experiment
var beforeEach = lab.beforeEach
var afterEach = lab.afterEach
var it = lab.test
var isWindows = require('is-windows')
var cli = require('../lib/cli')

describe('cli', function () {
  beforeEach(function (done) {
    done()
  })

  afterEach(function (done) {
    done()
  })

  describe('get command', function () {
    it('should be equals null when no parameter provided', function (done) {
      should(cli.getCommand()).eql(null)
      done()
    })

    it('should be equals null when empy array provided', function (done) {
      should(cli.getCommand([])).eql(null)
      done()
    })

    it('should returns command name', function (done) {
      should(cli.getCommand(['command'])).eql('command')
      done()
    })

    it('should skips env var and returns command name', function (done) {
      should(cli.getCommand(['FOO=BAR', 'command'])).eql('command')
      done()
    })

    it('should returns mutate env vars', function (done) {
      var enVars = {}
      cli.getCommand(['FOO=BAR'], enVars)
      enVars.should.be.instanceOf(Object)
      enVars.should.have.ownProperty('FOO', 'BAR')
      done()
    })

    it('should returns skips dotenv options', function (done) {
      var enVars = {}
      should(cli.getCommand(['--foo=bar'], enVars))
      enVars.should.be.instanceOf(Object)
      enVars.should.be.empty()
      done()
    })
  })

  describe('command convert', function () {
    it('should returns undefined', function (done) {
      should(cli.convertCommand()).eql(undefined)
      done()
    })

    it('should returns null', function (done) {
      should(cli.convertCommand(null)).eql(null)
      done()
    })

    it('should returns command', function (done) {
      should(cli.convertCommand('command')).eql('command')
      done()
    })

    it('should returns an env variable usage to be appropriate for the current OS', function (done) {
      should(cli.convertCommand('$foo_bar')).eql(isWindows() ? '%foo_bar%' : '$foo_bar')
      should(cli.convertCommand('%foo_bar%')).eql(isWindows() ? '%foo_bar%' : '$foo_bar')
      done()
    })
  })

  describe('get env variables', function () {
    it('should returns environment variable from process.env', function (done) {
      process.env.FOO = 'BAR'
      should(cli.getEnvVars()).ownProperty('FOO', 'BAR')
      delete process.env.FOO
      done()
    })

    it('should returns environment variable from .env', function (done) {
      cli.getEnvVars({path: './test/.env', encoding: 'utf-8'}).should.have.ownProperty('BASIC', 'basic')
      done()
    })
  })

  describe('get dotenv option', function () {
    it('should returns empty object when no options forwarded', function (done) {
      cli.getDotenvOptions().should.be.empty()
      cli.getDotenvOptions(['command']).should.be.empty()
      cli.getDotenvOptions(['FOO=BAR', 'command']).should.be.empty()
      done()
    })

    it('should returns object with options needed by dotenv', function (done) {
      var dotenvOptions = cli.getDotenvOptions(['--path=./test/.env', '--encoding=utf-8', 'command', '--foo=bar'])
      dotenvOptions.should.have.properties({'path': './test/.env', 'encoding': 'utf-8'})
      dotenvOptions.should.not.have.property('foo', 'bar')
      done()
    })
  })

  describe('get command args env vars', function () {
    it('should returns no future command and args', function (done) {
      process.env.FOO = 'BAR'
      var [command, args, env] = cli.getCommandArgsAndEnvVars()
      should(command).eql(null)
      args.should.be.instanceOf(Array)
      args.should.be.empty()
      env.should.have.ownProperty('FOO', 'BAR')
      delete process.env.FOO
      done()
    })

    it('should returns future command, args, and .env variables', function (done) {
      var [command, args, env] = cli.getCommandArgsAndEnvVars(['--path=./test/.env', 'FOO=BAR', 'command', '--foo=bar'])
      should(command).eql('command')
      args.should.be.instanceOf(Array)
      args.should.have.length(1)
      args[0].should.be.eql('--foo=bar')
      env.should.have.properties({'FOO': 'BAR', 'BASIC': 'basic'})
      done()
    })
  })

  describe('get dotenv option', function () {
    it('should returns empty object when no options forwarded', function (done) {
      cli.getDotenvOptions().should.be.empty()
      cli.getDotenvOptions(['command']).should.be.empty()
      cli.getDotenvOptions(['FOO=BAR', 'command']).should.be.empty()
      done()
    })

    it('should returns object with options needed by dotenv', function (done) {
      var dotenvOptions = cli.getDotenvOptions(['--path=./test/.env', '--encoding=utf-8', 'command', '--foo=bar'])
      dotenvOptions.should.have.properties({'path': './test/.env', 'encoding': 'utf-8'})
      dotenvOptions.should.not.have.property('foo', 'bar')
      done()
    })
  })

  describe('forward env into child process', function () {
    it('should returns null', function (done) {
      should(cli()).eql(null)
      done()
    })
  })
})
