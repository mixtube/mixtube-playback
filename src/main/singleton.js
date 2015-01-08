'use strict';

var defaults = require('lodash-node/modern/objects/defaults'),
  noop = require('lodash-node/modern/utilities/noop');

/**
 * @param {{additionListener: function(Object)=, removalListener: function(Object)=}}config
 * @returns {Singleton}
 */
function singleton(config) {

  config = defaults(config, {
    additionListener: noop,
    removalListener: noop
  });

  var _value = null;

  /**
   * @returns {*}
   */
  function get() {
    return _value;
  }

  /**
   * @param {*} value
   */
  function set(value) {
    var prevValue = _value;
    _value = value;

    if (prevValue !== _value) {
      if (prevValue) {
        config.removalListener(prevValue);
      }
      if (_value) {
        config.additionListener(_value);
      }
    }

    return prevValue;
  }

  /**
   * Clears the stored value without calling the "removalListener"
   *
   * @returns {*} the value stored before clearing
   */
  function clear() {
    var value = _value;
    _value = null;
    return value;
  }

  /**
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