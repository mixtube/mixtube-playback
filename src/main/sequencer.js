'use strict';

var enumeration = require('./enumeration'),
  singleton = require('./singleton'),
  collection = require('./collection'),
  promiseDone = require('./promiseDone'),
  console = require('console-browserify');

/**
 * @name Video
 * @typedef {Object} Video
 * @property {string} provider
 * @property {string} id
 */

/**
 * @name Entry
 * @typedef {Object} Entry
 */

/**
 * @typedef {Object} States
 * @property pristine
 * @property playing
 * @property paused
 * @property stopped
 */

/**
 * @type {States}
 */
var States = enumeration(['pristine', 'playing', 'paused', 'stopped']);

/**
 * @name sequencerConfig
 * @typedef {Object} sequencerConfig
 * @property {function(?Entry):Entry} nextEntryProducer
 * @property {function(Video, ?Video)} comingNext
 * @property {function({entry: Entry, endingSoon: function, ending: function}):PlaybackSlot} playbackSlotProducer
 */

/**
 * @param {sequencerConfig} config
 * @return Sequencer
 */
function sequencer(config) {

  var _config = config,

    _state = States.pristine;

  var _endingSlots = collection({
    additionListener: function(slot) {
      slot.end().then(function() {
        _endingSlots.remove(slot);
      });
    }
  });

  var _preloadingSlot = singleton({
    additionListener: function(slot) {
      slot.load();
    },
    removalListener: function(slot) {
      slot.end();
    }
  });

  var _skippingSlot = singleton({
    removalListener: function(slot) {
      _endingSlots.add(slot);
    }
  });

  var _playingSlot = singleton({
    additionListener: function(slot) {
      slot.start();
      var nextEntry = _config.nextEntryProducer(slot.entry);
      if (nextEntry) {
        preload(nextEntry);
      }
    },
    removalListener: function(slot) {
      _endingSlots.add(slot);
    }
  });

  /**
   * @param {Entry} entry
   * @returns {PlaybackSlot}
   */
  function newPlaybackSlot(entry) {
    return _config.playbackSlotProducer({
      entry: entry,
      endingSoon: notifyComingNext,
      ending: move
    });
  }

  function notifyComingNext() {
    var nextVideo = null;
    if (_skippingSlot.get()) {
      nextVideo = _skippingSlot.get().video
    } else if (_preloadingSlot.get()) {
      nextVideo = _preloadingSlot.get().video;
    }

    _config.comingNext(_playingSlot.get().video, nextVideo);
  }

  /**
   * @param {Entry} entry
   */
  function preload(entry) {
    if (!entry) {
      throw new TypeError('An entry is expected but found ' + entry);
    }

    var slot = newPlaybackSlot(entry);
    // setting the pre-loading singleton will automatically starts loading the slot
    _preloadingSlot.set(slot);
  }

  /**
   * Moves to the pre-loaded entry.
   *
   * If there is not pre-loaded slot this function does nothing
   */
  function move() {
    var slot = _preloadingSlot.get();
    if (slot) {
      promiseDone(
        slot.load().then(function() {
          if (slot === _preloadingSlot.get()) {
            _preloadingSlot.clear();
            _playingSlot.set(slot);
          }
        }));
    }
  }

  /**
   * Skips to the given entry.
   *
   * Skipping has priority over moving so that once loaded it will interrupt any playing slot to replace it.
   *
   * @param {Entry} entry
   */
  function skip(entry) {
    if (!entry) {
      throw new TypeError('An entry is expected but found ' + entry);
    }

    var slot = newPlaybackSlot(entry);
    _skippingSlot.set(slot);
    promiseDone(
      slot.load().then(function skipLoadFulfilled() {
        if (slot === _skippingSlot.get()) {
          _skippingSlot.clear();
          // preloaded slot became irrelevant because of skipping
          _preloadingSlot.set(null);
          _playingSlot.set(slot);
        }
      }));
  }

  function resume() {
    throw new Error();

  }

  function play() {
    if (_state === States.pristine || _state === States.stopped) {
      // todo should we rely on this behavior for play or should we expect skip to be called before
      var firstEntry = _config.nextEntryProducer(null);
      if (firstEntry) {
        _state = States.playing;
        skip(firstEntry);
      }
    } else if (_state === States.paused) {
      _state = States.playing;
      resume();
    }
  }

  function pause() {
    throw new Error();
  }

  /**
   * @name Sequencer
   * @typedef Sequencer
   */
  var Sequencer = {
    play: play,
    pause: pause,
    skip: skip
  };

  return Object.freeze(Sequencer);
}

module.exports = sequencer;