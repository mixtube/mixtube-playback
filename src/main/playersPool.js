'use strict';

var find = require('lodash/collection/find'),
  has = require('lodash/object/has');

/**
 * @param {{playerFactory: PlayerFactory}} config
 * @returns {PlayersPool}
 */
function playersPool(config) {

  var _config = config,
    _playersCacheByProvider = {};

  /**
   * @param {string} provider
   * @returns {Player}
   */
  function getPlayer(provider) {
    if (!provider) {
      throw new Error('A provider type has to be provided');
    }

    if (!_config.playerFactory.canCreatePlayer(provider)) {
      throw new Error('Unsupported provider type ' + provider);
    }

    if (!has(_playersCacheByProvider, provider)) {
      _playersCacheByProvider[provider] = [];
    }

    var playersCache = _playersCacheByProvider[provider];

    var playerCacheEntry = find(playersCache, {free: true});
    if (!playerCacheEntry) {
      playerCacheEntry = {
        player: _config.playerFactory.newPlayer(provider),
        free: false
      };
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
