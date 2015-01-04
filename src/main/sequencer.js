'use strict';

var singleton = require('./singleton'),
  collection = require('./collection');

/**
 * @name Video
 * @typedef {Object} Video
 * @property {string} provider
 * @property {string} id
 */

/**
 * @name Entry
 * @typedef {Object} Entry
 * @property {Video} video
 */

/**
 * @name sequencerConfig
 * @typedef {Object} sequencerConfig
 * @property {function(?Entry):Entry} fetchNext
 * @property {function(Entry):Video} fetchVideo
 * @property {function(Video, ?Video)} comingNext
 * @property {function({entry: Entry, endingSoon: function, ending: function})} playbackSlotProducer
 */

/**
 * @param {sequencerConfig} config
 * @return Sequencer
 */
function sequencer(config) {

  var _config = config;

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
      _preloadingSlot.clear();
      slot.start();
      preload(_config.fetchNext(slot.entry));
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
      slot.load().then(function() {
        if (slot === _preloadingSlot.clear()) {
          _playingSlot.set(slot);
        }
      });
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
    var slot = newPlaybackSlot(entry);
    _skippingSlot.set(slot);
    slot.load().then(function() {
      if (slot === _skippingSlot.clear()) {
        _playingSlot.set(slot);
      }
    });
  }

  function play() {
    skip(_config.fetchNext(null));
  }

  /**
   * @name Sequencer
   * @typedef Sequencer
   */
  var Sequencer = {
    play: play,
    skip: skip
  };

  return Object.freeze(Sequencer);
}

module.exports = sequencer;