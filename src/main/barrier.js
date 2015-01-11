'use strict';

/**
 * Creates a barrier closed by default.
 *
 * @returns {Barrier}
 */
function barrier() {

  var _open,
    _promise,
    _resolve;

  function open0() {
    _open = true;
    _resolve();
    _resolve = null;
  }

  function close0() {
    _open = false;
    _promise = new Promise(function(resolve) {
      _resolve = resolve;
    });
  }

  function open() {
    if (!_open) {
      open0();
    }
  }

  function close() {
    if (_open) {
      close0();
    }
  }

  /**
   * @returns {Promise}
   */
  function whenOpen() {
    return _promise;
  }

  close0();

  /**
   * @typedef Barrier
   * @name Barrier
   */
  var Barrier = {
    open: open,
    close: close,
    whenOpen: whenOpen
  };

  return Object.freeze(Barrier);
}

module.exports = barrier;