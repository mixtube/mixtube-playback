'use strict';

var Tweenable = require('shifty');
var noop = require('lodash-node/modern/utilities/noop');

/**
 * @param {{schedule: string, duration: number, step: function(number), from: number, to: number}} config
 * @returns {AnimationFade}
 */
function animationFade(config) {

  var _tween = new Tweenable(),

    _tweenConfig = {
      duration: config.duration,
      step: function(state) {
        config.step(state.value);
      },
      from: {value: config.from},
      to: {value: config.to}
    },

  // set in the start method Promise. A tween can be resolved because of a normal fade termination or because of a
  // premature call to stop
    _tweenResolve = noop;

  function startPromiseExecutor(resolve) {
    _tweenResolve = resolve;
    _tweenConfig.finish = resolve;
    _tween.tween(_tweenConfig);
  }

  /**
   * @returns {Promise} resolved when the fade action is finished either prematurely or normally
   */
  function start() {
    return new Promise(startPromiseExecutor);
  }

  function pause() {
    _tween.pause();
  }

  function resume() {
    _tween.resume();
  }

  function stop() {
    _tween.stop();
    _tweenResolve();
  }

  if (config.schedule !== 'ui') {
    _tween.setScheduleFunction(setTimeout);
  }

  /**
   * @typedef AnimationFade
   * @name AnimationFade
   */
  var AnimationFade = {
    start: start,
    pause: pause,
    resume: resume,
    stop: stop
  };

  return Object.freeze(AnimationFade);
}

module.exports = animationFade;
