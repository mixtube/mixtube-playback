'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var browserify = require('browserify');

gulp.task('watch', function() {
  var srcBundle = './src/test/players-pool.js';

  var bundler = watchify(browserify(srcBundle, watchify.args));

  bundler.on('update', rebundle);

  function rebundle() {
    return bundler.bundle()
      .on('error', gutil.log.bind(gutil, 'Browserify Error'))
      .pipe(source('players-pool.dist.js'))
      .pipe(gulp.dest('./src/test/'));
  }

  return rebundle();
});