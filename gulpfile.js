"use strict";

var gulp = require("gulp"),
eslint = require("gulp-eslint"),
istanbul = require("gulp-istanbul"),
mocha = require("gulp-mocha"),
coveralls = require("gulp-coveralls");

gulp.task("lint", function() {
  return gulp.src(["gulpfile.js", "lib/**/*.js", "test/**/*.js"])
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failOnError());
});

gulp.task("test", function() {
  return gulp.src("test/main.js", {read: false})
  .pipe(mocha());
});

gulp.task("testCoverage", function(cb) {
  gulp.src(["lib/main.js"])
  .pipe(istanbul())
  .pipe(istanbul.hookRequire())
  .on("finish", function() {
    gulp.src("test/main.js", {read: false})
    .pipe(mocha({reporter: "mocha-lcov-reporter"}))
    .pipe(istanbul.writeReports())
    .on("end", cb);
  });
});

gulp.task("coveralls", function() {
  return gulp.src("coverage/lcov.info")
  .pipe(coveralls());
});

gulp.task("default", ["lint", "test"]);

gulp.task("ci", ["testCoverage", "coveralls"]);
