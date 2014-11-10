(function(playback) {
  'use strict';

  /**
   * @name Promise
   * @typedef {Object} Promise
   * @property {function(function)} then
   * @property {function(function)} catch
   * @property {function(=*)} resolve
   */

  /**
   * @name Video
   * @typedef {Object} Video
   * @property {string} provider
   * @property {string} id
   */

  /**
   * @typedef {Object} Entry
   * @property {Video} video
   */

  /**
   * @param {{fetchNext: function(?Entry):Entry, fetchVideo: function(Entry):Video,comingNext: function(Video, ?Video)}} config
   */
  function sequencer(config) {

    var _playersPool = playback.playersPool({});

    var _endingSlots = playback.collection({
      additionListener: function(slot) {
        slot.end().then(function() {
          _endingSlots.remove(slot);
        });
      }
    });

    var _preloadingSlot = playback.singleton({
      additionListener: function(slot) {
        slot.load();
      },
      removalListener: function(slot) {
        slot.end();
      }
    });

    var _skippingSlot = playback.singleton({
      removalListener: function(slot) {
        _endingSlots.add(slot);
      }
    });

    var _playingSlot = playback.singleton({
      additionListener: function(slot) {
        _preloadingSlot.clear();
        slot.start();
        preload(config.fetchNext(slot.entry));
      },
      removalListener: function(slot) {
        _endingSlots.add(slot);
      }
    });

    /**
     *
     * @param {Entry} entry
     * @returns {PlaybackSlot}
     */
    function newPlaybackSlot(entry) {
      return playback.playbackSlot({
        entry: entry,
        cues: {
          endingSoon: notifyComingNext,
          ending: move
        },
        fetchVideo: config.fetchVideo,
        playersPool: _playersPool
      });
    }

    function notifyComingNext() {
      var nextVideo = null;
      if (_skippingSlot.get()) {
        nextVideo = _skippingSlot.get().video
      } else if (_preloadingSlot.get()) {
        nextVideo = _preloadingSlot.get().video;
      }

      config.comingNext(_playingSlot.get().video, nextVideo);
    }

    /**
     * @param {Entry} entry
     */
    function preload(entry) {
      var slot = newPlaybackSlot(entry);
      // setting the pre-loading singleton will automatically starts loading the slot
      _preloadingSlot.set(slot);
    }

    /**
     * Moves to the pre-loaded entry.
     *
     * If there is not pre-loaded slot this function does nothing
     */
    function move() {
      var slot = _preloadingSlot.get();
      if (slot) {
        slot.load().then(function() {
          if (slot === _preloadingSlot.clear()) {
            _playingSlot.set(slot);
          }
        });
      }
    }

    /**
     * Skips to the given entry.
     *
     * Skipping has priority over moving so that once loaded it will interrupt any playing slot to replace it.
     *
     * @param {Entry} entry
     */
    function skip(entry) {
      var slot = newPlaybackSlot(entry);
      _skippingSlot.set(slot);
      slot.load().then(function() {
        if (slot === _skippingSlot.clear()) {
          _playingSlot.set(slot);
        }
      });
    }

    function play() {
      skip(config.fetchNext(null));
    }


    var Sequencer = {
      play: play,
      skip: skip
    };

    return Object.freeze(Sequencer);
  }

  playback.sequencer = sequencer;

})(window.playback = {});
