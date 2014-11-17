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
  /**
   * @param {{audioGain: number}} config
   */
  play: function(config) {
  },
  /**
   * @param {{duration: number}} config
   * @returns {Promise}
   */
  fadeIn: function(config) {
  },
  /**
   * @param {{duration: number}} config
   * @returns {Promise}
   */
  fadeOut: function(config) {
  },
  stop: function() {
  }
};

var playerYoutube = require('./playerYoutube'),
  find = require('lodash-node/modern/collections/find'),
  has = require('lodash-node/modern/objects/has');

var _playersFactories = {
  youtube: playerYoutube
};

/**
 * @param {{produceElement: function(): Element}} config
 * @returns {PlayersPool}
 */
function playersPool(config) {

  var _config = config;

  var _playersCacheByProvider = {
    youtube: []
  };

  /**
   * @param {string} provider
   * @returns {Player}
   */
  function newPlayer(provider) {
    return _playersFactories[provider]({
      fadeDuration: _config.fadeDuration,
      produceElement: _config.produceElement
    });
  }

  /**
   * @param {string} provider
   * @returns {Player}
   */
  function getPlayer(provider) {
    if (!has(_playersCacheByProvider, provider)) {
      throw new Error('Unsupported player type ' + provider);
    }

    var playersCache = _playersCacheByProvider[provider];

    var playerCacheEntry = find(playersCache, {free: true});
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
    var playerCacheEntry = find(playersCache, {player: player});

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

module.exports = playersPool;
