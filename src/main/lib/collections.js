(function(playback) {
  'use strict';

  function cache(config) {

    function get(key) {
      throw new Error;
    }

    var Cache = {
      get: get
    };

    return Object.freeze(Cache);
  }

  function list(config) {

    function add(value) {
      throw new Error;
    }

    function first() {
      throw new Error;
    }

    var List = {
      add: add,
      first: first
    };

    return Object.freeze(List);
  }

  playback.cache = cache;

})({});
