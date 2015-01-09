'use strict';

var defaults = require('lodash-node/modern/objects/defaults'),
  noop = require('lodash-node/modern/utilities/noop');

/**
 * @template T
 * @param {{init: ?T, changedListener: function(T, T=)=}} config
 * @returns {Singleton.<T>}
 */
function singleton(config) {

  config = defaults(config, {
    init: null,
    changedListener: noop
  });

  var _value = config.init;

  /**
   * @returns {T}
   */
  function get() {
    return _value;
  }

  /**
   * @param {T} value
   */
  function set(value) {
    var prevValue = _value;
    _value = value;

    if (prevValue !== _value) config.changedListener(prevValue, _value);

    return prevValue;
  }

  /**
   * Clears the stored value without triggering the "changedListener"
   *
   * @returns {T} the value stored before clearing
   */
  function clear() {
    var value = _value;
    _value = null;
    return value;
  }

  /**
   * @template T
   * @name Singleton
   * @typedef Singleton
   */
  var Singleton = {
    get: get,
    set: set,
    clear: clear
  };

  return Object.freeze(Singleton);
}

module.exports = singleton;