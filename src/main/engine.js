'use strict';

var sequencer = require('./sequencer'),
  playbackSlot = require('./playbackSlot'),
  playersPool = require('./playersPool'),
  playerFactory = require('./playerFactory'),
  drmChecker = require('./drmChecker'),
  defaults = require('lodash/defaults'),
  noop = require('lodash/noop');

/**
 * @typedef {Object} Video
 * @property {string} provider
 * @property {string} id
 */

/**
 * @typedef {SequencerState} PlaybackState
 */

/**
 * @typedef {Object} engineDebug
 * @property {number} mediaDuration the forced duration of the medias in seconds
 * @property {number} mediaQuality the forced quality for the medias (supported values: low, default)
 */

/**
 * @typedef {Object} engineConfig
 * @property {function: Element} elementProducer
 * @property {function(*): Video} videoProducer
 * @property {function(*): *} nextEntryProducer
 * @property {number} transitionDuration
 * @property {?function(Entry, ?Entry)} comingNext
 * @property {?function(Entry)} playingChanged
 * @property {?function(PlaybackState, PlaybackState)} stateChanged
 * @property {?function(Entry, boolean)}  loadingChanged called each time an entry started or stopped to load
 *                                        following an user action (does not include preloading)
 * @property {?function(Entry, ?Error)} loadFailed
 * @property {?engineDebug} debug
 */

var debugDefaults = {
  mediaDuration: -1,
  mediaQuality: 'default'
};

/**
 * Creates the "Playback" facade.
 *
 * Transition is triggered at "transitionDuration" before the end of the media and the "comingNext: is notified
 * 2 times "transitionDuration" before the end.
 *
 * @param {engineConfig} config
 * @returns {Engine}
 */
function engine(config) {

  /** @type {engineConfig} */
  var _config = defaults({}, config, {
      comingNext: noop,
      stateChanged: noop,
      playingChanged: noop,
      loadingChanged: noop,
      loadFailed: noop,
      debug: debugDefaults
    }),

    _playersPoolMain = playersPool({
      playerFactory: playerFactory({
        elementProducer: _config.elementProducer,
        debug: {
          duration: _config.debug.mediaDuration,
          quality: _config.debug.mediaQuality
        }
      }),
      max: Infinity
    });

  /**
   * @param {{entry: Entry, endingSoon: function, ending: function}} slotProducerCfg
   * @returns {PlaybackSlot}
   */
  function playbackSlotProducer(slotProducerCfg) {
    return playbackSlot({
      entry: slotProducerCfg.entry,
      videoProducer: _config.videoProducer,
      transitionDuration: _config.transitionDuration,
      cues: {
        endingSoon: {
          time: function(duration) {
            return duration - _config.transitionDuration * 2;
          },
          callback: slotProducerCfg.endingSoon
        },
        ending: {
          time: function(duration) {
            return duration - _config.transitionDuration;
          },
          callback: slotProducerCfg.ending
        }
      },
      playersPool: _playersPoolMain
    });
  }

  var _sequencer = sequencer({
    nextEntryProducer: _config.nextEntryProducer,
    playbackSlotProducer: playbackSlotProducer,
    comingNext: _config.comingNext,
    stateChanged: _config.stateChanged,
    playingChanged: _config.playingChanged,
    loadingChanged: _config.loadingChanged,
    loadFailed: _config.loadFailed
  });

  /**
   * @typedef Engine
   * @name Engine
   */
  var Engine = {
    play: _sequencer.play,
    pause: _sequencer.pause,
    skip: _sequencer.skip,
    stop: _sequencer.stop,
    checkNextEntry: _sequencer.checkNextEntry
  };

  return Object.freeze(Engine);
}

engine.States = sequencer.States;

module.exports = engine;
