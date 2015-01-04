'use strict';

/**
 * @param {{additionListener: function(PlaybackSlot}} config
 * @returns Collection
 */
function collection(config) {

  function add(slot) {
    throw new Error;
  }

  function remove(slot) {
    throw new Error;
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