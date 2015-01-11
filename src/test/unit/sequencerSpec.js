'use strict';

var sequencer = require('../../main/sequencer'),
  playbackSlotMock = require('./playbackSlotMock'),
  defer = require('./defer'),
  defaults = require('lodash-node/modern/objects/defaults'),
  after = require('lodash-node/modern/functions/after'),
  times = require('lodash-node/modern/utilities/times'),
  identity = require('lodash-node/modern/utilities/identity'),
  last = require('lodash-node/modern/arrays/last'),
  initial = require('lodash-node/modern/arrays/initial'),
  wrap = require('lodash-node/modern/functions/wrap.js');


describe('A sequencer', function() {

  /**
   * @param {function(Object)=} inter
   * @returns {Sequencer}
   */
  function sequencerWithDefaults(inter) {
    inter = inter || identity;

    var defaultConfig = {
      nextEntryProducer: function(entry) {
        return null;
      },
      playbackSlotProducer: function(config) {
        var slot = playbackSlotMock({
          entry: config.entry,
          video: {provider: 'mock', id: 'video-' + config.entry}
        });
        slot.load.and.returnValue(Promise.resolve());
        slot.end.and.returnValue(Promise.resolve());
        return slot;
      },
      comingNext: jasmine.createSpy('comingNextSpy')
    };
    return sequencer(defaults({}, inter(defaultConfig), defaultConfig));
  }

  var _entries,
    _nextEntryProducer;

  beforeEach(function() {
    _entries = times(5, function(idx) {
      var id = 'mockEntry' + idx;
      return {
        id: id,
        toString: function() {
          return id;
        }
      };
    });

    _nextEntryProducer = function(entry) {
      var idx = 0;
      if (entry) {
        idx = _entries.indexOf(entry) + 1;
      }
      if (idx >= _entries.length) {
        return null;
      }
      return _entries[idx];
    };
  });

  it('does not call nextEntryProducer first call to play', function(done) {
    var nextEntryProducerSpy = jasmine.createSpy('nextEntryProducerSpy');
    var seq = sequencerWithDefaults(function() {
      return {
        nextEntryProducer: nextEntryProducerSpy
      }
    });

    seq.play();

    defer(function() {
      expect(nextEntryProducerSpy).not.toHaveBeenCalledWith(null);

      done();
    });
  });

  it('executes the right sequence when manually skipping to an entry', function(done) {
    var nextEntryProducerSpy =
        jasmine.createSpy('nextEntryProducerSpy')
          .and.callFake(_nextEntryProducer),

      playbackSlotProducerSpy = jasmine.createSpy('nextEntryProducerSpy');

    var seq = sequencerWithDefaults(function(seqDefaultCfg) {
      return {
        nextEntryProducer: nextEntryProducerSpy,
        playbackSlotProducer: playbackSlotProducerSpy
          .and.callFake(function(producerCfg) {
            finishGate();
            return seqDefaultCfg.playbackSlotProducer(producerCfg);
          })
      }
    });

    var expectedSlotProducerCallsCount = 4,
      finishGate = after(expectedSlotProducerCallsCount, function() {

        expect(nextEntryProducerSpy.calls.allArgs()).toEqual([
          // asked for the next entry after the entry 1
          [_entries[0]],
          // asked for the next entry after the entry 3
          [_entries[3]]
        ]);

        var slotLoadedEntries = playbackSlotProducerSpy.calls.allArgs()
          .map(function(args) {
            return args[0].entry;
          });

        expect(slotLoadedEntries).toEqual([
          // play from pristine state
          _entries[0],
          // preload next after entry 1 playing
          _entries[1],
          // manually skipped to entry 3
          _entries[3],
          // preload next after entry 3 playing
          _entries[4]
        ]);

        defer(done);
      });

    seq.skip(_entries[0]);
    seq.play();

    defer(function() {
      seq.skip(_entries[3]);
    });
  });

  it('schedules the preloaded entry properly so that it gets played on automated ending', function(done) {

    var comingNextSpy;
    var seq = sequencerWithDefaults(function(seqDefaultCfg) {

      comingNextSpy = seqDefaultCfg.comingNext;

      return {
        nextEntryProducer: _nextEntryProducer,
        playbackSlotProducer: function(producerCfg) {
          var slot = seqDefaultCfg.playbackSlotProducer(producerCfg);

          // fake auto ending
          slot.start.and.callFake(function() {
            defer(function() {
              producerCfg.endingSoon();
              defer(function() {
                producerCfg.ending();
                finishGate();
              });
            });
          });

          return slot;
        }
      }
    });

    var finishGate = after(_entries.length, function() {

      expect(comingNextSpy.calls.count()).toEqual(_entries.length);

      done();
    });

    seq.play();
    seq.skip(_entries[0]);
  });

  it('keeps the correct entry to play after many consecutive skip calls', function(done) {

    var slots = [];

    var seq = sequencerWithDefaults(function(seqDefaultCfg) {
      return {
        nextEntryProducer: _nextEntryProducer,
        playbackSlotProducer: function(producerCfg) {
          var slot = seqDefaultCfg.playbackSlotProducer(producerCfg);
          slots.push(slot);
          return slot;
        }
      }
    });

    seq.play();

    // browses the list of entry and skip until the last one
    new Promise(function(resolve) {
      (function deferredWhile(idx) {
        if (idx < _entries.length) {
          defer(function() {
            seq.skip(_entries[idx]);
            deferredWhile(idx + 1);
          });
        } else {
          resolve();
        }
      })(0);
    }).then(function() {

        // all but the last slot (the one playing right now with no next entry) should have been ended

        initial(slots).forEach(function(slot) {
          expect(slot.end).toHaveBeenCalled();
        });

        expect(last(slots).end).not.toHaveBeenCalled();
        expect(last(slots).entry).toEqual(last(_entries));

        done();
      });
  });

  it('pauses and resumes properly', function(done) {
    var slot,
      seq = sequencerWithDefaults(function(seqDefaultCfg) {
        return {
          playbackSlotProducer: function(producerCfg) {
            slot = seqDefaultCfg.playbackSlotProducer(producerCfg);

            slot.load.and.callFake(function() {
              defer(finish);
              return Promise.resolve();
            });

            return slot;
          }
        }
      });

    seq.play();
    seq.pause();
    seq.skip(_entries[0]);

    expect(slot.suspend).toHaveBeenCalled();

    seq.play();

    function finish() {

      expect(slot.proceed).toHaveBeenCalled();

      done();
    }
  });

  it('it resumes properly if skip was called while paused', function(done) {
    var slots = [],
      slotsIdx = 0,
      steps = [step1, step2],
      seq = sequencerWithDefaults(function(seqDefaultCfg) {
        return {
          playbackSlotProducer: function(producerCfg) {
            var slot = seqDefaultCfg.playbackSlotProducer(producerCfg);

            slots[slotsIdx] = slot;
            var step = steps[slotsIdx];

            slot.load.and.callFake(function() {
              defer(step);
              return Promise.resolve();
            });

            slotsIdx++;

            return slot;
          }
        }
      });

    seq.play();
    seq.pause();
    seq.skip(_entries[0]);

    function step1() {
      seq.skip(_entries[1]);
    }

    function step2() {
      seq.play();

      defer(function() {

        expect(slots[0].proceed).not.toHaveBeenCalled();
        expect(slots[1].proceed).toHaveBeenCalled();

        done();
      });
    }
  });

});
