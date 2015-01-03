'use strict';

var animationGroup = require('./animationGroup'),
  animationFade = require('./animationFade'),
  isNumber = require('lodash-node/modern/objects/isNumber'),
  EventEmitter = require('events').EventEmitter;

var _ytApiPromise = new Promise(function ytApiPromiseExecutor(resolve) {
  if (!('YT' in global)) {
    if ('onYouTubeIframeAPIReady' in window) {
      throw new Error('There is already a registered "onYouTubeIframeAPIReady" function');
    }
    global.onYouTubeIframeAPIReady = resolve;
  } else {
    resolve();
  }
});

/**
 * @param {{elementProducer: function(): Element}} config
 * @returns {PlayerYoutube}
 */
function playerYoutube(config) {

  var _config = config,
    _ytPlayerPromise = null,
    _ytPlayer = null,
    _fadeAnimationGroup = null,
    _audioGain = null;

  // we have to use an external event mechanism since the YT API doesn't provide a working removeEventListener
  // see https://code.google.com/p/gdata-issues/issues/detail?id=6700
  var _emitter = new EventEmitter;

  function newYtPlayer() {
    return new Promise(function(resolve) {
      var element = _config.elementProducer();
      if (!element) {
        throw new Error('The given "elementProducer" function did return any empty value');
      }

      // prepares for the next fade in animation and avoids FOUC
      element.style.opacity = 0;

      var player = new YT.Player(
        element,
        {
          height: '100%',
          width: '100%',
          events: {
            onReady: function() {
              resolve(player);
            },
            onStateChange: function(evt) {
              _emitter.emit('stateChange', evt);
            },
            onError: function(evt) {
              _emitter.emit('error', evt);
            }
          }
        });
    });
  }

  /**
   * Starts a fade (in / out) animation on the player by altering the opacity and the audio volume.
   *
   * If a fade animation was in progress it stops it first and starts fading from the last "values" for opacity
   * and volume.
   *
   * @param {boolean} fadeIn true to fade the player in, false to fade out
   * @param {number} duration
   * @returns {Promise}
   */
  function fade(fadeIn, duration) {

    var iFrame = _ytPlayer.getIframe(),
      volumeMax = _audioGain * 100,
      opacityFrom = fadeIn ? 0 : 1,
      volumeFrom = fadeIn ? 0 : volumeMax;

    if (_fadeAnimationGroup) {
      // a fade animation was in progress so we stop it to start a new one
      _fadeAnimationGroup.stop();
      // parse to float to avoid problems in Shifty
      opacityFrom = parseFloat(iFrame.style.opacity);
      volumeFrom = _ytPlayer.getVolume();
    }

    _fadeAnimationGroup = animationGroup({
      animations: {
        opacity: animationFade({
          schedule: 'ui',
          duration: duration,
          from: opacityFrom,
          to: fadeIn ? 1 : 0,
          step: function(value) {
            iFrame.style.opacity = value;
          }
        }),
        volume: animationFade({
          schedule: 'sound',
          duration: duration,
          from: volumeFrom,
          to: fadeIn ? volumeMax : 0,
          step: function(value) {
            _ytPlayer.setVolume(value);
          }
        })
      }
    });

    return _fadeAnimationGroup
      // we rely only on volume animation for its scheduling stability
      // whereas the opacity uses rAF which is throttled
      .start().volume
      .then(function() {
        // clear animation reference when done
        _fadeAnimationGroup = null;
      });
  }

  function newLoadPromiseExecutor(ytPlayer, id) {
    return function loadPromiseExecutor(resolve, reject) {

      function unbindLoadListeners() {
        _emitter.removeListener('stateChange', loadStateChangeListener);
        _emitter.removeListener('error', loadErrorListener);
      }

      function loadStateChangeListener(evt) {
        if (evt.data === YT.PlayerState.PLAYING) {
          unbindLoadListeners();
          ytPlayer.pauseVideo();
          resolve();
        }
      }

      function loadErrorListener(evt) {
        unbindLoadListeners();
        reject(new Error('An error with code ' + evt.data + ' occurred while loading the YouTube video ' + id));
      }

      // we wait for the player the start playing once to consider it loaded
      _emitter.on('stateChange', loadStateChangeListener);
      _emitter.on('error', loadErrorListener);

      ytPlayer.loadVideoById(id);
    }
  }

  function load(ytPlayer, id) {
    return new Promise(newLoadPromiseExecutor(ytPlayer, id));
  }

  function loadById(id) {
    return _ytApiPromise
      .then(function() {
        if (!_ytPlayerPromise) {
          _ytPlayerPromise = newYtPlayer();
        }
        return _ytPlayerPromise;
      })
      .then(function(ytPlayer) {
        _ytPlayer = ytPlayer;
        return load(ytPlayer, id);
      });
  }

  /**
   * @param {{audioGain: number}} config
   */
  function play(config) {
    _audioGain = isNumber(config.audioGain) ? config.audioGain : 1;
    _ytPlayer.playVideo();
  }

  function stop() {
    _ytPlayer.stopVideo();
  }

  /**
   * @param {{duration: number}} config
   */
  function fadeIn(config) {
    fade(true, config.duration);
  }

  /**
   * @param {{duration: number}} config
   * @returns {Promise}
   */
  function fadeOut(config) {
    return fade(false, config.duration);
  }

  /**
   * @typedef PlayerYoutube
   * @extend Player
   */
  var PlayerYoutube = {
    get provider() {
      return 'youtube';
    },
    get currentTime() {
      return _ytPlayer.getCurrentTime();
    },
    get duration() {
      return _ytPlayer.getDuration();
    },
    loadById: loadById,
    play: play,
    stop: stop,
    fadeIn: fadeIn,
    fadeOut: fadeOut
  };

  return Object.freeze(PlayerYoutube);
}

module.exports = playerYoutube;
