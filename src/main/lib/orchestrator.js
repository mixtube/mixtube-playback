(function(playback) {

  /**
   * @typedef {Object} Key
   * @property {string} provider
   * @property {string} id
   */

  /**
   * @typedef {Object} Cue
   * @property {function(number, number, PlaybackSlot)} test
   * @property {function} run
   */

  /**
   * @typedef {Object} Promise
   * @property {function(function)} then
   */

  /**
   * @param {{cues: Array.<Cue>}} config
   */
  function sequencer(config) {

    var _cues = config.cues || [];
    var _lifeCycle = playback.property();

    var _stoppingSlots = playback.list();

    var _frontSlot = playback.list({
      size: 1,
      finalizer: function(slot) {
        _stoppingSlots.add(slot);
      }
    });

    // a single element cache of load promise by key
    var _preloadCache = playback.cache({
      size: 1,
      loader: function(key) {
        return playback.playbackSlot({key: key});
      },
      finalizer: function(key, slot) {
        slot.stop();
      }
    });

    function play() {
      if (_lifeCycle.value !== 'PLAYING') {
        _lifeCycle.value = 'PLAYING';
      }
    }

    function pause() {
      if (_lifeCycle.value === 'PLAYING') {
        _lifeCycle.value = 'PAUSED';
      }
    }

    /**
     * A hint saying that we may need this media soon.
     *
     * @param {Key} key
     * @return {Promise}
     */
    function preload(key) {
      var slot = _preloadCache.get(key);
      // force loading upfront it
      return slot.load();
    }

    /**
     * Commands to start the media as soon as possible
     *
     * @param {Key} key
     * @return {Promise}
     */
    function skip(key) {
      var slot = _preloadCache.get(key);

      // todo the enrtry should expire no the slot
      slot.load().then(function() {
        _lifeCycle.holdUntil('PLAYING', function() {
          if (!slot.stale) {
            slot.start();
            _frontSlot.add(slot);
          }
        });
      });
    }

    function activate() {
      var previousCurrentTime = 0;
      setInterval(function cuesPolling() {
        var slot = _frontSlot.first();
        if (slot) {
          _cues.forEach(function(/*Cue*/ cue) {
            var currentTime = slot.currentTime;
            var movedForward = previousCurrentTime < currentTime;
            if (movedForward && cue.test(currentTime, previousCurrentTime, slot)) {
              cue.run();
            }
            previousCurrentTime = currentTime;
          });
        }
      }, 100);
    }

    var Sequencer = {
      play: play,
      pause: pause,
      preload: preload,
      skip: skip
    };

    return Object.freeze(Sequencer);
  }

  playback.orchestrator = sequencer;

})({});
