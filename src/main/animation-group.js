(function(playback) {
  "use strict";

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
      return _.mapValues(_config.animations, function(animation) {
        return animation.start();
      });
    }

    function stop() {
      _.forOwn(_config.animations, function(animation) {
        animation.stop();
      });
    }

    /**
     * @typedef AnimationGroup
     * @name AnimationGroup
     */
    var AnimationGroup = {
      start: start,
      stop: stop
    };

    return Object.freeze(AnimationGroup);
  }

  playback.animationGroup = animationGroup;

})(window.playback);
