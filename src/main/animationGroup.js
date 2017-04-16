'use strict';

var mapValues = require('lodash/mapValues'),
  forOwn = require('lodash/forOwn');

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

  function pause() {
    forOwn(_config.animations, function(animation) {
      animation.pause();
    });
  }

  function resume() {
    forOwn(_config.animations, function(animation) {
      animation.resume();
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
    pause: pause,
    resume: resume,
    stop: stop
  };

  return Object.freeze(AnimationGroup);
}

module.exports = animationGroup;
