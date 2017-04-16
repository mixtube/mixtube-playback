'use strict';

var defer = require('lodash/defer');

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

  // by saving an error here we can keep the calling context which helps for debugging
  var inContextError = new Error('Unhandled promise rejection detected');

  promise.catch(function(err) {
    err = err || inContextError;

    defer(function() {
      console.error(err.stack);
      throw err;
    });
  });
}

module.exports = promiseDone;