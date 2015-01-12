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

  bundler.on('update', function() {
    gutil.log('Bundle "' + src + '" updated');
    rebundle();
  });

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
    './src/test/unit/playerSpec.js',
    './dist/test/unit/playerSpec.bundle.js');

  installWatchify(
    './src/test/unit/sequencerSpec.js',
    './dist/test/unit/sequencerSpec.bundle.js');

  installWatchify(
    './src/test/integration/playlistSpec.js',
    './dist/test/integration/playlistSpec.bundle.js');

  installWatchify(
    './src/test/integration/playlistSpec.js',
    './dist/test/integration/playlistSpec.bundle.js');

  installWatchify(
    './src/test/integration/web/main.js',
    './dist/test/integration/web/main.bundle.js');
});

gulp.task('serve', ['watch'], function() {
  var baseDirs = ['src/test/integration/web', 'dist/test/integration/web'];

  browserSync({
    open: false,
    server: {
      baseDir: baseDirs
    }
  });

  gulp.watch(baseDirs.map(function(baseDir) {
    return baseDir + '/**/*'
  }), browserSync.reload);

});

gulp.task('default', ['serve']);