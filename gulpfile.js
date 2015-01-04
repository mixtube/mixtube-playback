'use strict';

var path = require('path'),
  gulp = require('gulp'),
  gutil = require('gulp-util'),
  source = require('vinyl-source-stream'),
  watchify = require('watchify'),
  browserify = require('browserify'),
  browserSync = require('browser-sync');

function installWatchify(src, dest) {
  var bundler = watchify(
    browserify(src,
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
      .pipe(source(path.basename(dest)))
      .pipe(gulp.dest(path.dirname(dest)));
  }

  return rebundle();
}

gulp.task('watch', function() {
  installWatchify(
    './src/test-legacy/playersPoolTests.js',
    './dist/test-legacy/playersPoolTests.bundle.js');

  installWatchify(
    './src/test/playerTests.js',
    './dist/test/playerTests.bundle.js');

  installWatchify(
    './src/test/sequencerTests.js',
    './dist/test/sequencerTests.bundle.js');
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