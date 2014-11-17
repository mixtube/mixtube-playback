(function(playback) {
  "use strict";

  /**
   * @param {{animations: Array.<AnimationFade>}} config
   * @returns {AnimationGroup}
   */
  function animationGroup(config) {

    /**
     * @returns {Promise}
     */
    function start() {
      var promises = [];
      config.animations.forEach(function(animation) {
        promises.push(animation.start());
      });

      return Promise.all(promises);
    }

    function stop() {
      config.animations.forEach(function(animation) {
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
