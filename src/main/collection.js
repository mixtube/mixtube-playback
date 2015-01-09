'use strict';

var defaults = require('lodash-node/modern/objects/defaults'),
  noop = require('lodash-node/modern/utilities/noop'),
  pull = require('lodash-node/modern/arrays/pull');

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

  /**
   * @template T
   * @name Collection
   * @typedef Collection
   */
  var Collection = {
    add: add,
    remove: remove
  };

  return Object.freeze(Collection);
}

module.exports = collection;