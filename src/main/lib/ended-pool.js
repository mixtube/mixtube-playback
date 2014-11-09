(function(playback) {

  /**
   * @param {{additionListener: function(PlaybackSlot}} config
   */
  function endedPool(config) {

    function add(slot) {
      throw new Error;
    }

    function remove(slot) {
      throw new Error;
    }

    var EndedPool = {
      add: add,
      remove: remove
    };

    return Object.freeze(EndedPool);
  }

  playback.endedPool = endedPool;

})({});
