(function(playback) {
  'use strict';

  /**
   *
   * @param {{additionListener: function(PlaybackSlot)=, removalListener: function(PlaybackSlot)=}}config
   */
  function slotSingleton(config) {

    /**
     * @returns {PlaybackSlot}
     */
    function get() {
      throw new Error;
    }

    /**
     * @param {PlaybackSlot} slot
     */
    function set(slot) {
      throw new Error;
    }

    /**
     * @returns {PlaybackSlot}
     */
    function clear() {
      throw new Error;
    }

    var SlotSingleton = {
      get: get,
      set: set,
      clear: clear
    };

    return Object.freeze(SlotSingleton);
  }

  playback.slotSingleton = slotSingleton;

})({});
