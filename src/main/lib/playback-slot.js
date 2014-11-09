(function(playback) {

  /**
   * @param {{entry: Entry}} config
   */
  function playbackSlot(config) {

    /**
     * @return {Promise}
     */
    function load() {
      throw new Error;
    }

    /**
     * <code>endingSoon</code> is called a little before auto ending is triggered or just when manual ending is called
     *
     * @param {{cues: {endingSoon: function}}} config
     */
    function start(config) {
      throw new Error;
    }

    /**
     * Initiate slot termination and unregister the cues callbacks.
     *
     * @return {Promise}
     */
    function end() {
      throw new Error;
    }

    var PlaybackSlot = {
      get entry() {
        throw new Error;
      },
      load: load,
      start: start,
      end: end
    };

    return Object.freeze(PlaybackSlot);

  }

  playback.playbackSlot = playbackSlot;

})({});
