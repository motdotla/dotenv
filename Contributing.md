# Contributing

1. Fork it
2. `npm install gulp -g` (as needed)
2. `npm install`
3. Create your feature branch (`git checkout -b my-new-feature`)
4. Commit your changes (`git commit -am 'Added some feature'`)
5. Push to the branch (`git push origin my-new-feature`)
6. Create new Pull Request

## Testing

We use [mocha](https://github.com/mochajs/mocha) and [should](https://github.com/shouldjs/should.js) to write BDD test. Run our test suite with this command:

```
gulp test
```

### Coverage

We use [istanbul](https://github.com/gotwarlost/istanbul) to measure code coverage. Because of the size of the project, we like to maintain 100% for statements, branches, functions, and lines (read: everything). See how your changes impact coverage by running:

```
gulp testCoverage
```

## Code Style

We use [eslint](http://eslint.org) and [editorconfig](http://editorconfig.org) to maintain code style and best practices. Please make sure your PR adheres to the guides by running:

```
gulp lint
```
