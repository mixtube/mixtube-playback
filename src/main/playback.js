'use strict';

var sequencer = require('./sequencer'),
  playbackSlot = require('./playbackSlot'),
  playersPool = require('./playersPool'),
  playerFactory = require('./playerFactory'),
  defaults = require('lodash-node/modern/objects/defaults'),
  noop = require('lodash-node/modern/utilities/noop');

/**
 * @typedef {Object} Video
 * @property {string} provider
 * @property {string} id
 */

/**
 * @typedef {SequencerState} PlaybackState
 */

/**
 * @typedef {Object} playbackConfig
 * @property {function: Element} elementProducer
 * @property {function(*): Video} videoProducer
 * @property {function(*): *} nextEntryProducer
 * @property {number} transitionDuration
 * @property {?function(Video, ?Video)} comingNext
 * @property {?function(PlaybackState, PlaybackState)} stateChanged
 * @property {?function(Entry, ?Error)} loadFailed
 */

/**
 * Creates the "Playback" facade.
 *
 * Transition is triggered at "transitionDuration" before the end of the media and the "comingNext: is notified
 * 2 times "transitionDuration" before the end.
 *
 * @param {playbackConfig} config
 * @returns {Playback}
 */
function playback(config) {

  /** @type {playbackConfig} */
  var _config = defaults({}, config, {comingNext: noop, stateChanged: noop}),

    _playersPool = playersPool({
      playerFactory: playerFactory({
        elementProducer: _config.elementProducer
      })
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
      playersPool: _playersPool
    });
  }

  var _sequencer = sequencer({
    nextEntryProducer: _config.nextEntryProducer,
    playbackSlotProducer: playbackSlotProducer,
    comingNext: _config.comingNext
  });

  /**
   * @typedef Playback
   * @name Playback
   */
  var Playback = {
    play: _sequencer.play,
    pause: _sequencer.pause,
    skip: _sequencer.skip
  };

  return Object.freeze(Playback);
}

playback.States = sequencer.States;

module.exports = playback;
