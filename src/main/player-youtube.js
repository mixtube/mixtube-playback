(function(playback, signals) {
  'use strict';

  var _ytApiPromise = new Promise(function(resolve) {
    if (!('YT' in window)) {
      if ('onYouTubeIframeAPIReady' in window) {
        throw new Error('There is already a registered "onYouTubeIframeAPIReady" function');
      }
      window.onYouTubeIframeAPIReady = function() {
        resolve();
      };
    } else {
      resolve();
    }
  });

  /**
   * @param {{produceElement: function(): Element}} config
   * @returns {PlayerYoutube}
   */
  function playerYoutube(config) {

    var _ytPlayerPromise = null;
    var _ytPlayer = null;

    // we have to use an external event mechanism since the YT API doesn't provide a working removeEventListener
    // see https://code.google.com/p/gdata-issues/issues/detail?id=6700
    var _signals = {
      onStateChange: new signals.Signal()
    };

    function newYtPlayer() {
      return new Promise(function(resolve) {
        var element = config.produceElement();
        if (!element) {
          throw new Error('The given "produceElement" element function did return any empty value');
        }

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
                _signals.onStateChange.dispatch(evt);
              }
            }
          });
      });
    }

    function load(ytPlayer, id) {
      return new Promise(function(resolve) {
        // we wait for the player the start playing once to consider it loaded
        var firstPlayingBinding = _signals.onStateChange.add(function(evt) {
          if (evt.data === YT.PlayerState.PLAYING) {
            firstPlayingBinding.detach();
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

    function play() {
      _ytPlayer.playVideo();
    }

    function stop() {
      _ytPlayer.stopVideo();
    }

    function fadeIn() {

    }

    function fadeOut() {
      return Promise.resolve();
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

  playback.playerYoutube = playerYoutube;

})(window.playback, window.signals);

