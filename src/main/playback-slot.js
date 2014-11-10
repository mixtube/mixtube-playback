(function(playback) {
  'use strict';

  /**
   * Cues:
   * <code>endingSoon</code> is called a little before auto ending is triggered or just before manual ending is called
   * <code>ending</code> is called when auto ending is triggered or just before slot ending
   *
   * @param {{entry: Entry, cues: {endingSoon: function, ending: function}, fetchVideo: function(Entry):Video, playersPool: PlayersPool}} config
   * @returns {PlaybackSlot}
   */
  function playbackSlot(config) {

    var _playersPool = config.playersPool;

    var _loaded = false;
    var _started = true;
    var _ended = false;
    var _error = false;

    var _player = null;
    var _loadPromise = null;
    var _endPromise = null;

    function getVideo() {
      return config.fetchVideo(config.entry);
    }

    function checkStage(predicate, method, requiredStage) {
      if (!predicate) {
        throw new Error('The slot "' + method + '" method should be called only when the ' + requiredStage
        + ' stage is completed');
      }
    }

    function dispose() {
      _playersPool.releasePlayer(_player);
    }

    /**
     * @return {Promise}
     */
    function load() {
      if (!_loadPromise) {
        var video = getVideo();
        var player = _playersPool.getPlayer(video.provider);

        _loadPromise =
          player.loadById(video.id)
            .then(function() {
              _loaded = true;
            })
            .catch(function() {
              _error = true;
            });
      }

      return _loadPromise;
    }

    /**
     * Kicks the slot in by starting the player and fading it in.
     *
     * This method can only be called once the loading stage successfully completed.
     */
    function start() {
      checkStage(_loaded, 'start', 'loading');
      _started = true;

      _player.play();
      _player.fadeIn();
    }

    /**
     * Initiate slot termination and unregister the cues callbacks.
     *
     * @return {Promise}
     */
    function end() {
      if (!_endPromise) {
        if (_started) {
          _endPromise =
            _player
              .fadeOut()
              .then(function() {
                _player.stop();
              })
        } else if (_loaded || _error) {
          _endPromise = Promise.resolve();
        }

        _endPromise.then(function() {
          dispose();
          _ended = true;
        });
      }

      return _endPromise;
    }

    /**
     * @typedef PlaybackSlot
     * @name PlaybackSlot
     */
    var PlaybackSlot = {
      /**
       * @return {Entry}
       */
      get entry() {
        return config.entry
      },
      /**
       * @returns {Video}
       */
      get video() {
        return getVideo();
      },
      load: load,
      start: start,
      end: end
    };

    return Object.freeze(PlaybackSlot);
  }

  playback.playbackSlot = playbackSlot;

})
(window.playback);
