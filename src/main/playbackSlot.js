'use strict';

/**
 * @typedef {Object} States
 * @property pristine
 * @property loading
 * @property loaded
 * @property playing
 * @property ending
 * @property ended
 */
var States = {};
['pristine', 'loading', 'loaded', 'playing', 'ending', 'ended']
  .forEach(function(stateName) {
    var state = {
      toString: function() {
        return stateName;
      }
    };
    Object.defineProperty(States, stateName, {
      get: function() {
        return state;
      }
    });
  });

/**
 * Cues:
 * <code>endingSoon</code> is called a little before auto ending is triggered or just before manual ending is called
 * <code>ending</code> is called when auto ending is triggered or just before slot ending
 *
 * @param {{entry: Entry, cues: {endingSoon: function, ending: function}, autoEndTimeProducer: function(number):number, videoFetcher: function(Entry):Video, playersPool: PlayersPool, transitionDuration: number}} config
 * @returns {PlaybackSlot}
 */
function playbackSlot(config) {

  var _config = config,
    _playersPool = _config.playersPool,

    _state = States.pristine,

    _player = null,
    _loadPromise = null,
    _endPromise = null,
    _stopCuesHandler = null;

  function getVideo() {
    return _config.videoFetcher(_config.entry);
  }

  function checkState(requiredState, method) {
    if (_state !== requiredState) {
      throw new Error('The slot "' + method + '" method should be called only when in ' + requiredState
      + ' state (current is ' + _state + ')');
    }
  }

  /**
   * Calls the "ending soon" callback in a sandbox if it has not been done yet.
   */
  function callEndingSoonCb() {
    if (!callEndingSoonCb.called) {
      callEndingSoonCb.called = true;
      sandBoxedExecute(_config.cues.endingSoon);
    }
  }

  function callEndingCb() {
    sandBoxedExecute(_config.cues.ending);
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
    if (_state === States.pristine) {
      _state = States.loading;

      var video = getVideo();
      _player = _playersPool.getPlayer(video.provider);

      _loadPromise =
        _player.loadById(video.id)
          .then(function() {
            _state = States.loaded;
          })
          .catch(function(e) {
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
    checkState(States.loaded, 'start');

    _state = States.playing;

    _player.play(config);
    _player.fadeIn({duration: _config.transitionDuration});
    _stopCuesHandler = startCuesHandler();
  }

  /**
   * Initiate slot termination, unregister the cues callbacks and frees the underlying resources (player etc.).
   *
   * @return {Promise}
   */
  function end() {
    if (!_endPromise) {
      if (_state === States.playing) {
        _state = States.ending;
        _stopCuesHandler();
        _endPromise =
          _player
            .fadeOut({duration: _config.transitionDuration})
            .then(function() {
              _player.stop();
              callEndingSoonCb();
              callEndingCb();
            });
      } else {
        _endPromise = Promise.resolve();
      }

      _endPromise
        .then(function() {
          _state = States.ended;
          dispose();
        });
    }

    return _endPromise;
  }

  /**
   * @returns {function} the stop function for the cues handler
   */
  function startCuesHandler() {
    var duration = _player.duration * 1000,
      autoEndTime = Math.min(duration - _config.transitionDuration,
        _config.autoEndTimeProducer(duration)),
      endingSoonTime = autoEndTime - 10000,
      previousTime = 0;

    var intervalId = setInterval(function cuesHandlerIntervalExecutor() {
      var currentTime = _player.currentTime * 1000;

      if (previousTime < currentTime) {
        // consider only progress in time

        if (previousTime < endingSoonTime && endingSoonTime < currentTime) {
          callEndingSoonCb();
        }

        if (previousTime < autoEndTime && autoEndTime < currentTime) {
          end();
        }
      }

      previousTime = currentTime;
    }, 100);

    return function stopCuesHandler() {
      clearInterval(intervalId);
    }
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
