'use strict';

var defer = require('lodash-node/modern/functions/defer');

/**
 * Makes sure no exception is made silent.
 *
 * The rule is to use "done" only if it is at the end of the promise chain.
 *
 * @param {Promise} promise
 */
function promiseDone(promise) {
  if (!promise) {
    throw new TypeError('A Promise is expected but found ' + promise);
  }

  promise.catch(function(err) {
    err = err || new Error('Unhandled promise rejection detected');

    defer(function() {
      throw err;
    });
  });
}

module.exports = promiseDone;