'use strict';

var find = require('lodash/find'),
  has = require('lodash/has'),
  objectPool = require('./objectsPool');

/**
 * @typedef Object playersPoolConfig
 * @property {PlayerFactory} playerFactory
 * @property {number} [Infinity] max the maximum number of player to create
 */

/**
 * @param {{playerFactory: PlayerFactory, max: number}} config
 * @returns {PlayersPool}
 */
function playersPool(config) {

  var _config = config,
    _poolsByProviders = {};

  /**
   * @param {string} provider
   * @returns {Promise.<Player>}
   */
  function getPlayer(provider) {
    if (!provider) {
      throw new Error('A provider type has to be provided');
    }

    if (!_config.playerFactory.canCreatePlayer(provider)) {
      throw new Error('Unsupported provider type ' + provider);
    }

    if (!has(_poolsByProviders, provider)) {
      _poolsByProviders[provider] = objectPool({
        factory: function() {
          return _config.playerFactory.newPlayer(provider);
        },
        max: _config.max
      });
    }

    return _poolsByProviders[provider].acquire();
  }

  function releasePlayer(player) {
    _poolsByProviders[player.provider].release(player);
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
