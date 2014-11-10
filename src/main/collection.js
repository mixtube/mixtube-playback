(function(playback) {
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
     * @typedef Collection
     */
    var Collection = {
      add: add,
      remove: remove
    };

    return Object.freeze(Collection);
  }

  playback.collection = collection;

})(window.playback);
