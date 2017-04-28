'use strict';

var playersPool = require('./playersPool'),
  playerFactory = require('./playerFactory'),
  defaults = require('lodash/defaults'),
  pFinally = require('p-finally');

/**
 * @typedef {Object} drmCheckerConfig
 * @property {PlayersPool} playersPool
 */

/**
 *
 * @param {drmCheckerConfig} config
 * @returns {DrmChecker}
 */
function drmChecker(config) {

  var _config = defaults({}, config, {
      max: 4
    }),

    _playersPool = playersPool({
      playerFactory: playerFactory({
        elementProducer: _config.elementProducer,
        // debug settings make non sense for DRM check
        debug: {
          mediaDuration: -1,
          mediaQuality: 'default'
        }
      }),
      max: _config.max
    });

  /**
   * @param {Entry} entry
   * @returns {Promise.<DrmCheckReport>}
   */
  function checkDrm(entry) {
    return _playersPool.getPlayer(entry.provider)
      .then(function(player) {
        return pFinally(player.checkDrmById(entry.id),
          function checkDrmFinally() {
            _playersPool.releasePlayer(player);
          });
      });
  }

  /**
   * @typedef DrmChecker
   * @name DrmChecker
   */
  var DrmChecker = {
    checkDrm: checkDrm
  };

  return Object.freeze(DrmChecker);
}

module.exports = drmChecker;
