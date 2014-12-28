'use strict';

var gulp = require('gulp'),
  gutil = require('gulp-util'),
  source = require('vinyl-source-stream'),
  watchify = require('watchify'),
  browserify = require('browserify'),
  browserSync = require('browser-sync');

gulp.task('watch', function() {
  var srcBundle = './src/test-legacy/playersPoolTests.js';

  var bundler = watchify(
    browserify(srcBundle,
      {
        cache: {},
        packageCache: {},
        fullPaths: true,
        debug: true
      }));

  bundler.on('update', rebundle);

  function rebundle() {
    return bundler.bundle()
      .on('error', gutil.log.bind(gutil, 'Browserify Error'))
      .pipe(source('playersPoolTests.bundle.js'))
      .pipe(gulp.dest('dist/test-legacy'));
  }

  return rebundle();
});

gulp.task('serve', function() {
  browserSync({
    server: {
      baseDir: ['src/test-legacy', 'dist/test-legacy']
    },
    open: false
  });
});

gulp.task('default', ['watch', 'serve']);