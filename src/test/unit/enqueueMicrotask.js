/**
 * Based on Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 */
'use strict';

var isFunction = require('lodash/isFunction'),
  slice = require('lodash/slice');

/**
 * Defers executing the `func` function until the current microtasks stack has cleared.
 * Additional arguments will be provided to `func` when it is invoked.
 *
 * It is a version inspired from the lodash one but based on Promise instead of timeout which
 * is convenient for test when the clock is mocked and manipulated.
 *
 * @param {Function} func The function to defer.
 * @param {...*} [arg] Arguments to invoke the function with.
 */
function enqueueMicrotask(func) {
  if (!isFunction(func)) {
    throw new TypeError();
  }
  var args = slice(arguments, 1);
  Promise.resolve().then(function() { func.apply(undefined, args); });
}

module.exports = enqueueMicrotask;
