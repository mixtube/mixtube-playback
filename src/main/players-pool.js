(function(playback) {
  'use strict';

  /**
   * @typedef Player
   * @name Player
   * @interface
   */
  var Player = {
    provider: '',
    /**
     * @param {string} id the video id. This id is opaque and only makes sense for the player implementation.
     * @returns {Promise}
     */
    loadById: function(id) {
    },
    play: function() {
    },
    /**
     * @returns {Promise}
     */
    fadeIn: function() {
    },
    /**
     * @returns {Promise}
     */
    fadeOut: function() {
    },
    stop: function() {
    }
  };

  var _playersFactories = {
    youtube: playback.playerYoutube
  };

  /**
   * @param {{fadeDuration: number, produceElement: function(): Element}} config
   * @returns {PlayersPool}
   */
  function playersPool(config) {

    var _playersCacheByProvider = {
      youtube: []
    };

    /**
     * @param {string} provider
     * @returns {Player}
     */
    function newPlayer(provider) {
      return _playersFactories[provider]({fadeDuration: config.fadeDuration, produceElement: config.produceElement});
    }

    /**
     * @param {string} provider
     * @returns {Player}
     */
    function getPlayer(provider) {
      if (!_.has(_playersCacheByProvider, provider)) {
        throw new Error('Unsupported player type ' + provider);
      }

      var playersCache = _playersCacheByProvider[provider];

      var playerCacheEntry = _.find(playersCache, {free: true});
      if (!playerCacheEntry) {
        playerCacheEntry = {player: newPlayer(provider), free: false};
        playersCache.push(playerCacheEntry);
      } else {
        playerCacheEntry.free = false;
      }

      return playerCacheEntry.player;
    }

    function releasePlayer(player) {
      var playersCache = _playersCacheByProvider[player.provider];
      var playerCacheEntry = _.find(playersCache, {player: player});

      if (!playerCacheEntry) {
        throw new Error('Found a foreign player instance registered in the pool');
      }

      playerCacheEntry.free = true;
    }

    /**
     * @typedef PlayersPool
     * @name PlayersPool
     */
    var PlayersPool = {
      getPlayer: getPlayer,
      releasePlayer: releasePlayer
    };

    return Object.freeze(PlayersPool);
  }

  playback.playersPool = playersPool;

})(window.playback);

