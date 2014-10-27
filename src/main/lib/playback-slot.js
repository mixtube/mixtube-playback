(function(playback) {

  /**
   * @param {{key: Key}} config
   */
  function playbackSlot(config) {

    /**
     * @return {Promise}
     */
    function load() {
      throw new Error;
    }

    function play() {
      throw new Error;
    }

    function pause() {
      throw  new Error;
    }

    function stop() {
      throw new Error;
    }

    var PlaybackSlot = {
      get loading() {
        throw new Error;
      },
      load: load,
      play: play,
      pause: pause,
      stop: stop
    };

    return Object.freeze(PlaybackSlot);

  }

  playback.playbackSlot = playbackSlot;

})({});
