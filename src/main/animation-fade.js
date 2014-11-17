(function(playback, Tweenable, setTimeout) {
  "use strict";

  /**
   * @param {{schedule: string, duration: number, step: function(number), from: number, to: number}} config
   * @returns {AnimationFade}
   */
  function animationFade(config) {

    var _tween = new Tweenable();
    if (config.schedule !== 'ui') {
      _tween.setScheduleFunction(setTimeout);
    }

    var _tweenConfig = {
      duration: config.duration,
      step: function(state) {
        config.step(state.value);
      },
      from: {value: config.from},
      to: {value: config.to}
    };

    // set in the start method Promise. A tween can be resolved because of a normal fade termination or because of a
    // premature call to stop
    var _tweenResolve = _.noop;

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

    function stop() {
      _tween.stop();
      _tweenResolve();
    }

    /**
     * @typedef AnimationFade
     * @name AnimationFade
     */
    var AnimationFade = {
      start: start,
      stop: stop
    };

    return Object.freeze(AnimationFade);
  }

  playback.animationFade = animationFade;

})(window.playback, window.Tweenable, window.setTimeout);

