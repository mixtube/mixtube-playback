'use strict';

var defaults = require('lodash/defaults'),
  noop = require('lodash/noop'),
  pull = require('lodash/pull');

/**
 * @template T
 * @param {{addedListener: function(T)=}} config
 * @returns Collection.<T>
 */
function collection(config) {

  config = defaults(config, {
    addedListener: noop
  });

  var _values = [];

  function add(slot) {
    if (slot) {
      _values.push(slot);
      config.addedListener(slot);
    }
  }

  function remove(slot) {
    pull(_values, slot);
  }

  function forEach(callback) {
    _values.forEach(callback);
  }

  /**
   * @template T
   * @name Collection
   * @typedef Collection
   */
  var Collection = {
    add: add,
    remove: remove,
    forEach: forEach
  };

  return Object.freeze(Collection);
}

module.exports = collection;