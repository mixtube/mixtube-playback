'use strict';

var mapValues = require('lodash-node/modern/objects/mapValues'),
  forOwn = require('lodash-node/modern/objects/forOwn');

/**
 * @param {{animations: Object.<string, AnimationFade>}} config
 * @returns {AnimationGroup}
 */
function animationGroup(config) {

  var _config = config;

  /**
   * @returns {Object.<string, Promise>}
   */
  function start() {
    return mapValues(_config.animations, function(animation) {
      return animation.start();
    });
  }

  function stop() {
    forOwn(_config.animations, function(animation) {
      animation.stop();
    });
  }

  /**
   * @typedef AnimationGroup
   */
  var AnimationGroup = {
    start: start,
    stop: stop
  };

  return Object.freeze(AnimationGroup);
}

module.exports = animationGroup;
