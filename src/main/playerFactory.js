'use strict';

var playerYoutube = require('./playerYoutube');

/**
 * @param {{elementProducer: function(): Element}} config
 * @returns {PlayerFactory}
 */
function playerFactory(config) {

  var _config = config;

  var _playersFactories = {
    youtube: playerYoutube
  };


  /**
   * @param {string} provider
   * @returns {Player}
   */
  function newPlayer(provider) {
    return _playersFactories[provider]({
      elementProducer: _config.elementProducer
    });
  }

  /**
   * @typedef PlayerFactory
   * @name PlayerFactory
   */
  var PlayerFactory = {
    newPlayer: newPlayer
  };

  return Object.freeze(PlayerFactory);
}

module.exports = playerFactory;