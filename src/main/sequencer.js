'use strict';

var enumeration = require('./enumeration'),
  singleton = require('./singleton'),
  collection = require('./collection'),
  promiseDone = require('./promiseDone');

/**
 * @name Entry
 * @typedef {Object} Entry
 */

/**
 * @name SequencerState
 * @typedef {Object} SequencerState
 */

/**
 * @name SequencerStates
 * @typedef {Object} SequencerStates
 * @property {SequencerState} pristine
 * @property {SequencerState} playing
 * @property {SequencerState} paused
 * @property {SequencerState} stopped
 */

/**
 * @type {SequencerStates}
 */
var States = enumeration(['pristine', 'playing', 'paused', 'stopped']);

/**
 * @name sequencerConfig
 * @typedef {Object} sequencerConfig
 * @property {function(?Entry):Entry} nextEntryProducer
 * @property {function(Entry, ?Entry)} comingNext
 * @property {function({entry: Entry, endingSoon: function, ending: function}):PlaybackSlot} playbackSlotProducer
 * @property {function(SequencerState, SequencerState)} stateChanged
 * @property {function(Entry)} playingChanged
 * @property {function(Entry, boolean)} loadingChanged
 * @property {function(Entry, ?Error)} loadFailed
 */

/**
 * @param {sequencerConfig} config
 * @return Sequencer
 */
function sequencer(config) {

  var _config = config,

    _state = singleton({
      init: States.pristine,
      changedListener: function(prevState, state) {
        if (state === States.playing) {
          forEachSlot(function(slot) {
            slot.proceed();
          });
        } else if (state === States.paused) {
          forEachSlot(function(slot) {
            slot.suspend();
          });
        }

        _config.stateChanged(prevState, state);
      }
    }),

    _endingSlots = collection({
      addedListener: function(slot) {
        slot.end()
          .then(function slotEndFulfilled() {
            _endingSlots.remove(slot);
            probeStateOnSlotEnded();
          });
      }
    }),

    _preloadingSlot = singleton({
      changedListener: function(prevSlot, slot) {
        if (prevSlot) prevSlot.end()
          .then(function slotEndFulfilled() {
            probeStateOnSlotEnded();
          });

        if (slot) {
          // load the slot and retry in case of loading error until a working entry is found
          promiseDone(
            slot.load()
              .catch(function(error) {

                _config.loadFailed(slot.entry, error);

                if (slot === _preloadingSlot.get()) {
                  _preloadingSlot.clear();
                  var nextEntry = _config.nextEntryProducer(slot.entry);
                  if (nextEntry) {
                    preload(nextEntry);
                  }
                }
              }));
        }
      }
    }),

    _skippingSlot = singleton({
      changedListener: function(prevSlot) {
        if (prevSlot) _endingSlots.add(prevSlot);
      }
    }),

    _playingSlot = singleton({
      changedListener: function(prevSlot, slot) {
        if (prevSlot) _endingSlots.add(prevSlot);

        if (slot) {
          slot.start();
          _config.playingChanged(slot.entry);
          var nextEntry = _config.nextEntryProducer(slot.entry);
          if (nextEntry) {
            preload(nextEntry);
          }
        }
      }
    });

  function forEachSlot(callback) {
    [_preloadingSlot, _skippingSlot, _playingSlot]
      .forEach(function(singleton) {
        if (singleton.get()) callback(singleton.get());
      });

    _endingSlots.forEach(callback);
  }

  /**
   * Have to be called anytime a slot ends. It makes sure the state of the sequencer is set to stopped if there
   * is not more valid entry playing or about to play.
   */
  function probeStateOnSlotEnded() {
    var size = 0;
    forEachSlot(function() {
      size++;
    });
    if (size === 0) {
      _state.set(States.stopped);
    }
  }

  /**
   * @param {Entry} entry
   * @returns {PlaybackSlot}
   */
  function newPlaybackSlot(entry) {
    var slot = _config.playbackSlotProducer({
      entry: entry,
      endingSoon: notifyComingNext,
      ending: function newSlotEnding() {
        move(slot);
      }
    });

    if (_state.get() === States.playing) {
      slot.proceed();
    } else {
      slot.suspend();
    }

    return slot;
  }

  function notifyComingNext() {
    var nextEntry = null;
    if (_skippingSlot.get()) {
      nextEntry = _skippingSlot.get().entry;
    } else if (_preloadingSlot.get()) {
      nextEntry = _preloadingSlot.get().entry;
    }

    _config.comingNext(_playingSlot.get().entry, nextEntry);
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
   * Ends the playing slot by nullifying the "playingSlot" singleton and moves to the pre-loaded entry.
   *
   * A call to this function is honored only when the given slot is the one currently playing.
   *
   * @param {PlaybackSlot} commandingSlot
   */
  function move(commandingSlot) {
    if (_playingSlot.get() === commandingSlot) {
      var slot = _preloadingSlot.get();
      if (!slot) {
        // can't preload anything but we still have to put the playing slot in the ending stage
        _playingSlot.set(null);
      } else {
        promiseDone(
          slot.load()
            .then(function moveLoadFulfilled() {
              if (slot === _preloadingSlot.get()) {
                _preloadingSlot.clear();
                _playingSlot.set(slot);
              }
            })
            // retry on load failure since the "preloadingSlot" singleton will automatically tries the next entries
            // a valid slot may be available now
            .catch(function moveLoadRejected() {
              move(commandingSlot);
            }));
      }
    }
  }

  /**
   * @param {*} entry
   * @returns {Promise}
   */
  function skip0(entry) {
    var slot = newPlaybackSlot(entry);
    _skippingSlot.set(slot);

    var loadPromise = slot.load()
      .then(function skipLoadFulfilled() {

        _config.loadingChanged(entry, false);

        if (slot === _skippingSlot.get()) {
          // clear only because we don't want to discard the skipping slot
          // we are going to transfer it to the playing state
          _skippingSlot.clear();
          // preloaded slot became irrelevant because of skipping
          _preloadingSlot.set(null);
          _playingSlot.set(slot);
        }
      })
      .catch(function skipLoadRejected(error) {

        _config.loadingChanged(entry, false);
        _config.loadFailed(slot.entry, error);

        if (slot === _skippingSlot.get()) {
          var nextEntry = _config.nextEntryProducer(slot.entry);
          if (!nextEntry) {
            // no entry to load we can not skip
            // make sure the current skipping slot id discarded properly
            _skippingSlot.set(null);
          } else {
            return skip0(nextEntry);
          }
        }
      });

    _config.loadingChanged(entry, true);

    return loadPromise;
  }

  /**
   * Skips to the given entry and retries in case of loading error until it finds a working entry.
   *
   *
   * Skipping has priority over moving so that once loaded it will interrupt any playing slot to replace it.
   *
   * @param {Entry} entry
   */
  function skip(entry) {
    if (!entry) {
      throw new TypeError('An entry is expected but found ' + entry);
    }

    promiseDone(skip0(entry));
  }

  function play() {
    _state.set(States.playing);
  }

  function pause() {
    _state.set(States.paused);
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

sequencer.States = States;

module.exports = sequencer;