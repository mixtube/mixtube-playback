(function(playback) {
  'use strict';

  /**
   * @param {{additionListener: function(Object)=, removalListener: function(Object)=}}config
   * @returns {Singleton}
   */
  function singleton(config) {

    /**
     * @returns {*}
     */
    function get() {
      throw new Error;
    }

    /**
     * @param {*} value
     */
    function set(value) {
      throw new Error;
    }

    /**
     * @returns {*}
     */
    function clear() {
      throw new Error;
    }

    /**
     * @typedef Singleton
     */
    var Singleton = {
      get: get,
      set: set,
      clear: clear
    };

    return Object.freeze(Singleton);
  }

  playback.singleton = singleton;

})(window.playback);
