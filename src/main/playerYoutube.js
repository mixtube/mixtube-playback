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
 * @param {{fadeDuration: number, volumeGain: number, produceElement: function(): Element}} config
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
      var element = _config.produceElement();
      if (!element) {
        throw new Error('The given "produceElement" element function did return any empty value');
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
   * @returns {Promise}
   */
  function fade(fadeIn) {

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
          duration: _config.fadeDuration,
          from: opacityFrom,
          to: fadeIn ? 1 : 0,
          step: function(value) {
            iFrame.style.opacity = value;
          }
        }),
        volume: animationFade({
          schedule: 'sound',
          duration: _config.fadeDuration,
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

  function load(ytPlayer, id) {
    return new Promise(function(resolve) {
      // we wait for the player the start playing once to consider it loaded
      _emitter.on('stateChange', function stateChangeListener(evt) {
        if (evt.data === YT.PlayerState.PLAYING) {
          _emitter.removeListener('stateChange', stateChangeListener);
          ytPlayer.pauseVideo();
          resolve();
        }
      });
      ytPlayer.loadVideoById(id);
    });
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

  function fadeIn() {
    return fade(true);
  }

  function fadeOut() {
    return fade(false);
  }

  /**
   * @typedef PlayerYoutube
   * @name PlayerYoutube
   * @extend Player
   */
  var PlayerYoutube = {
    get provider() {
      return 'youtube';
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
