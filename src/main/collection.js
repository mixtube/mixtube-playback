'use strict';

var defaults = require('lodash-node/modern/objects/defaults'),
  noop = require('lodash-node/modern/utilities/noop'),
  pull = require('lodash-node/modern/arrays/pull');

/**
 * @param {{additionListener: function(Object}} config
 * @returns Collection
 */
function collection(config) {

  config = defaults(config, {
    additionListener: noop
  });

  var _values = [];

  function add(slot) {
    if (slot) {
      _values.push(slot);
      config.additionListener(slot);
    }
  }

  function remove(slot) {
    pull(_values, slot);
  }

  /**
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