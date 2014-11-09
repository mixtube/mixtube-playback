(function(playback) {

  /**
   * @typedef {Object} Promise
   * @property {function(function)} then
   */

  /**
   * @typedef {Object} Video
   * @property {string} provider
   * @property {string} id
   */

  /**
   * @typedef {Object} Entry
   * @property {Video} video
   */

  /**
   * @param {{fetchNext: function(?Entry):Entry, comingNext: function(Video, ?Video)}} config
   */
  function sequencer(config) {

    var _endedPool = playback.endedPool({
      additionListener: function(slot) {
        slot.end().then(function() {
          _endedPool.remove(slot);
        });
      }
    });

    var _preloadingSingleton = playback.slotSingleton({
      additionListener: function(slot) {
        slot.load();
      },
      removalListener: function(slot) {
        slot.end();
      }
    });

    var _skippingSingleton = playback.slotSingleton({
      removalListener: function(slot) {
        _endedPool.add(slot);
      }
    });

    var _playingSingleton = playback.slotSingleton({
      additionListener: function(slot) {
        _preloadingSingleton.clear();
        slot.start({
          cues: {
            endingSoon: notifyComingNext,
            ending: move
          }
        });
        preload(config.fetchNext(slot.entry));
      },
      removalListener: function(slot) {
        _endedPool.add(slot);
      }
    });

    function notifyComingNext() {
      var nextVideo = null;
      if (_skippingSingleton.get()) {
        nextVideo = _skippingSingleton.get().entry.video
      } else if (_preloadingSingleton.get()) {
        nextVideo = _preloadingSingleton.get().entry.video;
      }

      config.comingNext(_playingSingleton.get().entry.video, nextVideo);
    }

    /**
     * @param {Entry} entry
     */
    function preload(entry) {
      var slot = playback.playbackSlot({entry: entry});
      _preloadingSingleton.set(slot);
    }

    function move() {
      var slot = _preloadingSingleton.get();
      if (slot) {
        slot.load().then(function() {
          if (slot === _preloadingSingleton.clear()) {
            _playingSingleton.set(slot);
          }
        });
      }
    }

    /**
     * @param {Entry} entry
     */
    function skip(entry) {
      var slot = playback.playbackSlot({entry: entry});
      _skippingSingleton.set(slot);
      slot.load().then(function() {
        if (slot === _skippingSingleton.clear()) {
          _playingSingleton.set(slot);
        }
      });
    }

    function play() {
      skip(config.fetchNext(null));
    }


    var Sequencer = {
      play: play,
      pause: pause,
      preload: preload,
      skip: skip
    };

    return Object.freeze(Sequencer);
  }

  playback.sequencer = sequencer;

})({});
