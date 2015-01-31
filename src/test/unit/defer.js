/**
 * Based on Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 */
'use strict';

var isFunction = require('lodash/lang/isFunction'),
  slice = require('lodash/array/slice');

/**
 * Defers executing the `func` function until the current call stack has cleared.
 * Additional arguments will be provided to `func` when it is invoked.
 *
 * It is a version inspired from the lodash one but based on Promise instead of timeout which
 * is convenient for test when the clock is mocked and manipulated.
 *
 * @param {Function} func The function to defer.
 * @param {...*} [arg] Arguments to invoke the function with.
 * @example
 *
 * _.defer(function(text) { console.log(text); }, 'deferred');
 * // logs 'deferred' after one or more milliseconds
 */
function defer(func) {
  if (!isFunction(func)) {
    throw new TypeError();
  }
  var args = slice(arguments, 1);
  Promise.resolve().then(function() { func.apply(undefined, args); });
}

module.exports = defer;
