'use strict';

var gulp = require('gulp'),
  gutil = require('gulp-util'),
  source = require('vinyl-source-stream'),
  watchify = require('watchify'),
  browserify = require('browserify');

gulp.task('watch', function() {
  var srcBundle = './src/test/players-pool.js';

  var bundler = watchify(browserify(srcBundle, {cache: {}, packageCache: {}, fullPaths: true, debug: true}));

  bundler.on('update', rebundle);

  function rebundle() {
    return bundler.bundle()
      .on('error', gutil.log.bind(gutil, 'Browserify Error'))
      .pipe(source('players-pool.dist.js'))
      .pipe(gulp.dest('./src/test/'));
  }

  return rebundle();
});