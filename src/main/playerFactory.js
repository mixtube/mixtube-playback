'use strict';

var playerYoutube = require('./playerYoutube'),
  has = require('lodash-node/modern/objects/has');

/**
 * @param {{elementProducer: function(): Element}} config
 * @returns {PlayerFactory}
 */
function playerFactory(config) {

  var _config = config;

  var _playersFactories = {
    youtube: playerYoutube
  };

  function canCreatePlayer(provider) {
    return has(_playersFactories, provider);
  }

  /**
   * @param {string} provider
   * @returns {Player}
   */
  function newPlayer(provider) {
    if (!canCreatePlayer(provider)) {
      throw new Error('Unsupported provider type ' + provider);
    }

    return _playersFactories[provider]({
      elementProducer: _config.elementProducer
    });
  }

  /**
   * @typedef PlayerFactory
   * @name PlayerFactory
   */
  var PlayerFactory = {
    canCreatePlayer: canCreatePlayer,
    newPlayer: newPlayer
  };

  return Object.freeze(PlayerFactory);
}

module.exports = playerFactory;