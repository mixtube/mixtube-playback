'use strict';

/**
 * Cues:
 * <code>endingSoon</code> is called a little before auto ending is triggered or just before manual ending is called
 * <code>ending</code> is called when auto ending is triggered or just before slot ending
 *
 * @param {{entry: Entry, cues: {endingSoon: function, ending: function}, fetchVideo: function(Entry):Video, playersPool: PlayersPool, transitionDuration: number}} config
 * @returns {PlaybackSlot}
 */
function playbackSlot(config) {

  var _config = config,
    _playersPool = _config.playersPool,

    _endingSoonCb = function() {
      _endingSoonCb.called = true;
      sandBoxedExecute(_config.cues.endingSoon);
    },
    _endingCb = function() {
      sandBoxedExecute(_config.cues.ending);
    },

    _loaded = false,
    _started = false,
    _ended = false,
    _error = false,

    _player = null,
    _loadPromise = null,
    _endPromise = null;

  function getVideo() {
    return _config.fetchVideo(_config.entry);
  }

  function checkStage(predicate, method, requiredStage) {
    if (!predicate) {
      throw new Error('The slot "' + method + '" method should be called only when the ' + requiredStage
      + ' stage is completed');
    }
  }

  /**
   * Essentially a try / catch around the given function.
   *
   * @param {function} fn
   */
  function sandBoxedExecute(fn) {
    try {
      fn();
    } catch (e) {
      console.error('An error occurred while executing the sand-boxed function %s', fn);
      console.error(e);
    }
  }

  function dispose() {
    _playersPool.releasePlayer(_player);
  }

  /**
   * Tries to load the video associated to the slot's entry.
   *
   * If it succeed the slot can be started. If it fails, the slot is automatically "ended" and can not be started.
   *
   * @return {Promise}
   */
  function load() {
    if (!_loadPromise) {
      var video = getVideo();

      _player = _playersPool.getPlayer(video.provider);

      _loadPromise =
        _player.loadById(video.id)
          .then(function() {
            _loaded = true;
          })
          .catch(function(e) {
            _error = true;
            end();
            // propagate the rejection
            return Promise.reject(e);
          });
    }

    return _loadPromise;
  }

  /**
   * Kicks the slot in by starting the player and fading it in.
   *
   * This method can only be called once the loading stage successfully completed.
   *
   * @param {{audioGain: number}} config
   */
  function start(config) {
    checkStage(_loaded, 'start', 'loading');
    _started = true;

    _player.play(config);
    _player.fadeIn({duration: _config.transitionDuration});
  }

  /**
   * Initiate slot termination, unregister the cues callbacks and frees the underlying resources (player etc.).
   *
   * @return {Promise}
   */
  function end() {
    checkStage((_loaded || _started) && !_error, 'end', 'loading or playing');

    if (!_endPromise) {
      if (!_started) {
        _endPromise = Promise.resolve();
      } else {
        _endPromise =
          _player
            .fadeOut({duration: _config.transitionDuration})
            .then(function() {
              _player.stop();
            });
      }

      _endPromise
        .then(function() {
          if (!_endingSoonCb.called) {
            _endingSoonCb();
          }
          _endingCb();
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
      return _config.entry
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

module.exports = playbackSlot;
