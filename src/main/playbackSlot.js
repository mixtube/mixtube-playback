'use strict';

var once = require('lodash-node/modern/functions/once');

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
 * @typedef {Object} playbackSlotConfig
 * @property {Entry} entry
 * @property {{endingSoon: {time: function(number):number, callback: function}}} cues
 * @property {function(Entry):Video} videoFetcher
 * @property {PlayersPool} playersPool
 * @property {number} transitionDuration
 */

/**
 * Cues:
 * <code>endingSoon</code> is called a little before auto ending is triggered or just before manual ending is called
 * <code>ending</code> is called when auto ending is triggered or just before slot ending
 *
 * @param {playbackSlotConfig} config
 * @returns {PlaybackSlot}
 */
function playbackSlot(config) {

  /** @type {playbackSlotConfig} */
  var _config = config,
    _playersPool = _config.playersPool,

    _state = States.pristine,

    _player = null,
    _loadPromise = null,
    _endPromise = null,
    _duration = null,

    _stopCuesHandler = null,

    callEndingSoonOnce = once(function() {
      sandBoxedExecute(_config.cues.endingSoon.callback);
    }),
    callEndingOnce = once(function() {
      sandBoxedExecute(_config.cues.ending.callback)
    });

  function checkState(requiredState, method) {
    if (_state !== requiredState) {
      throw new Error('The slot "' + method + '" method should be called only when in ' + requiredState
      + ' state (current is ' + _state + ')');
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

  function getCurrentTime() {
    return _player.currentTime * 1000;
  }

  function getVideo() {
    return _config.videoFetcher(_config.entry);
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
            _duration = _player.duration * 1000;
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
    // make sure the transition will be finished before the end of the media
    _player.fadeIn({duration: Math.min(_duration, _config.transitionDuration)});
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

        // make sure the cues are called while ending if it has not been done before
        callEndingSoonOnce();
        callEndingOnce();

        _endPromise =
          _player
            // make sure the transition will be finished before the end of the media
            .fadeOut({duration: Math.min(_duration - getCurrentTime(), _config.transitionDuration)})
            .then(function() {
              _player.stop();
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
    var autoEndTime = Math.min(
        Math.max(0, _config.cues.ending.time(_duration)),
        _duration - _config.transitionDuration),

      endingSoonTime = Math.min(
        Math.max(0, _config.cues.endingSoon.time(_duration)),
        autoEndTime),

      previousTime = 0;

    var intervalId = setInterval(function cuesHandlerIntervalExecutor() {
      var currentTime = getCurrentTime();

      if (previousTime < currentTime) {
        // consider only progress in time

        if (previousTime < endingSoonTime && endingSoonTime < currentTime) {
          callEndingSoonOnce();
        }

        if (previousTime < autoEndTime && autoEndTime < currentTime) {
          callEndingOnce();
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
