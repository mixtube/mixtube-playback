'use strict';

var sequencer = require('../main/sequencer'),
  playbackSlotMock = require('./playbackSlotMock'),
  defaults = require('lodash-node/modern/objects/defaults');

//return playbackSlot({
//  entry: entry,
//  cues: {
//    endingSoon: notifyComingNext,
//    ending: move
//  },
//  fetchVideo: _config.fetchVideo,
//  playersPool: _config.playersPool
//});


describe('A sequencer', function() {

  function sequencerWithDefaults(config) {
    var defaultConfig = {
      nextEntryProducer: function(entry) {
        return null;
      },
      playbackSlotProducer: function(config) {
        var slot = playbackSlotMock();
        slot.load.and.returnValue(Promise.resolve());
        return slot;
      },
      comingNext: function(currentVideo, comingVideo) {

      }
    };
    return sequencer(defaults({}, config, defaultConfig));
  }

  it('calls nextEntryProducer with a "null" arguments on first call to play', function() {
    var nextEntryProducerSpy = jasmine.createSpy('nextEntryProducerSpy');
    var seq = sequencerWithDefaults({
      nextEntryProducer: nextEntryProducerSpy
    });

    seq.play();

    expect(nextEntryProducerSpy).toHaveBeenCalledWith(null);
  });

  it('calls nextEntryProducer with a "null" arguments on first call to play', function() {
    var nextEntryProducerSpy = jasmine.createSpy('nextEntryProducerSpy');
    var seq = sequencerWithDefaults({
      nextEntryProducer: nextEntryProducerSpy
    });

    seq.play();

    expect(nextEntryProducerSpy).toHaveBeenCalledWith(null);
  });

});
