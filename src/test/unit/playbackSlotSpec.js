/* globals jasmine */

'use strict';

var playbackSlot = require('../../main/playbackSlot'),
  playersPoolMock = require('./playersPoolMock'),
  enqueueMicrotask = require('./enqueueMicrotask'),
  defaults = require('lodash/defaults'),
  constant = require('lodash/constant'),
  identity = require('lodash/identity'),
  pFinally = require('p-finally'),

  describe = jasmine.getEnv().describe,
  it = jasmine.getEnv().it,
  expect = jasmine.getEnv().expect;

describe('A player slot', function() {

  /**
   * @param {function(Object)=} inter
   * @returns {PlaybackSlot}
   */
  function playbackSlotWithDefaults(inter) {
    inter = inter || identity;

    var defaultConfig = {
      entry: {mockMedia: {mediaSource: 'mock', mediaKey: 'mockId'}},
      videoProducer: function(entry) {
        return {
          provider: entry.mockMedia.mediaSource,
          id: entry.mockMedia.mediaKey
        };
      },
      cues: {
        endingSoon: {
          time: function(duration) {
            return duration - 2000;
          }, callback: jasmine.createSpy('endingSoon')
        },
        ending: {
          time: function(duration) {
            return duration - 1000;
          }, callback: jasmine.createSpy('ending')
        }
      },
      transitionDuration: 1000
    };

    var slot = playbackSlot(defaults({}, inter(defaultConfig), defaultConfig));
    slot.proceed();
    return slot;
  }

  it('calls videoProducer with the given entry when load is called', function() {

    var entryMock = {};
    var videoProducerSpy = jasmine
      .createSpy('videoProducerSpy')
      .and.returnValue({provider: 'mock', id: 'mockId'});

    var pool = playersPoolMock();

    var slot = playbackSlotWithDefaults(function() {
      return {
        playersPool: pool,
        entry: entryMock,
        videoProducer: videoProducerSpy
      };
    });

    slot.load();

    expect(videoProducerSpy).toHaveBeenCalledWith(entryMock);
  });

  it('returns and resolves the promise', function(done) {
    var pool = playersPoolMock();
    var loadSuccessSpy = jasmine.createSpy('loadSuccessSpy');

    var slot = playbackSlotWithDefaults(function() {
      return {playersPool: pool};
    });

    pFinally(slot.load().then(loadSuccessSpy), function() {
      expect(loadSuccessSpy).toHaveBeenCalled();
      done();
    });
  });

  it('starts the slot properly', function(done) {
    var playSpy,
      fadeInSpy,
      transitionDuration = 10;

    var pool = playersPoolMock(function(props, player) {
      props.duration = transitionDuration * 4;
      playSpy = player.play;
      fadeInSpy = player.fadeIn;
      return player;
    });

    var slot = playbackSlotWithDefaults(function() {
      return {
        playersPool: pool,
        transitionDuration: transitionDuration
      };
    });

    slot.load().then(function() {
      slot.start();

      fadeInSpy.and.callFake(function() {
        expect(playSpy).toHaveBeenCalledWith({audioGain: 1});
        expect(fadeInSpy).toHaveBeenCalledWith({duration: transitionDuration});

        slot.end();

        done();
      });
    });
  });


  it('does not start when it is suspended', function(done) {
    var playSpy,

      pool = playersPoolMock(function(props, player) {
        playSpy = player.play;
        return player;
      }),

      slot = playbackSlotWithDefaults(function() {
        return {
          playersPool: pool
        };
      });

    slot.suspend();

    slot.load().then(function() {
      var config = {audioGain: 0};
      slot.start(config);

      enqueueMicrotask(function() {
        expect(playSpy).not.toHaveBeenCalled();

        done();
      });
    });
  });

  it('does not end when it is suspended', function(done) {
    var fadeOutSpy,

      pool = playersPoolMock(function(props, player) {
        fadeOutSpy = player.fadeOut;
        return player;
      }),

      slot = playbackSlotWithDefaults(function() {
        return {
          playersPool: pool
        };
      });

    slot.load().then(function() {
      var config = {audioGain: 0};
      slot.start(config);
      slot.suspend();

      slot.end();

      enqueueMicrotask(function() {
        expect(fadeOutSpy).not.toHaveBeenCalled();

        done();
      });
    });
  });

  describe('when a call to load is unsuccessful', function() {

    it('returns and reject the promise', function(done) {
      var loadFailSpy = jasmine.createSpy('loadFailSpy');
      var pool = playersPoolMock(function(props, player) {
        player.loadById.and.returnValue(Promise.reject());
        return player;
      });


      var slot = playbackSlotWithDefaults(constant({playersPool: pool}));

      pFinally(slot.load().then(null, loadFailSpy), function() {
        expect(loadFailSpy).toHaveBeenCalled();
        done();
      });
    });

    it('ends the slot properly', function(done) {
      var endingSoonSpy = jasmine.createSpy('endingSoonSpy'),
        endingSpy = jasmine.createSpy('endingSpy');

      var pool = playersPoolMock(function(props, player) {
        player.loadById.and.returnValue(Promise.reject());
        return player;
      });

      var slot = playbackSlotWithDefaults(constant({
        playersPool: pool,
        cues: {
          endingSoon: {callback: endingSoonSpy},
          ending: {callback: endingSpy}
        }
      }));

      pFinally(slot.load(), function() {
        expect(endingSoonSpy).not.toHaveBeenCalled();
        expect(endingSpy).not.toHaveBeenCalled();
        enqueueMicrotask(function() {
          expect(pool.releasePlayer).toHaveBeenCalled();
          done();
        });
      });
    });
  });

  it('triggers an error when start is called before load', function() {

    var slot = playbackSlotWithDefaults();

    expect(function() {
      slot.start({audioGain: 0});
    }).toThrow();
  });

  it('adapts transition time if exceed media duration ', function(done) {
    var fadeInSpy,
      fadeOutSpy,
      playerProps,
      videoDuration = 20000,
      transitionDuration = videoDuration * 2;

    var pool = playersPoolMock(function(props, player) {
      playerProps = props;
      playerProps.duration = videoDuration / 1000;
      fadeInSpy = player.fadeIn;
      fadeOutSpy = player.fadeOut;
      return player;
    });


    var slot = playbackSlotWithDefaults(constant({
      playersPool: pool,
      transitionDuration: transitionDuration
    }));

    slot.load().then(function() {

      slot.start({audioGain: 0});

      var remainingTime = 500;
      playerProps.currentTime = (videoDuration - remainingTime) / 1000;

      slot.end().then(function() {

        expect(fadeInSpy).toHaveBeenCalledWith({duration: videoDuration});
        expect(fadeOutSpy).toHaveBeenCalledWith({duration: remainingTime});

        done();
      });
    });
  });

  it('ends the slot properly when end is called (forced end)', function(done) {
    var stopSpy, fadeOutSpy,
      endingSpy = jasmine.createSpy('endingSpy'),
      endingSoonSpy = jasmine.createSpy('endingSoonSpy'),
      transitionDuration = 10;

    var pool = playersPoolMock(function(props, player) {
      fadeOutSpy = player.fadeOut;
      stopSpy = player.stop;
      return player;
    });

    var slot = playbackSlotWithDefaults(constant({
      playersPool: pool,
      transitionDuration: transitionDuration,
      cues: {
        endingSoon: {callback: endingSoonSpy, time: constant(0)},
        ending: {callback: endingSpy, time: constant(0)}
      }
    }));

    slot.load().then(function() {
      slot.start();
      enqueueMicrotask(function() {
        slot.end().then(function() {

          expect(fadeOutSpy).toHaveBeenCalled();
          expect(stopSpy).toHaveBeenCalled();
          expect(endingSpy).toHaveBeenCalled();
          expect(endingSoonSpy).not.toHaveBeenCalled();

          done();
        });
      });
    });
  });

  it('runs "ending soon" and "ending" in schedule (auto ending)', function(done) {
    var fadeOutSpy,
      playSpy,
      endingSpy = jasmine.createSpy('endingSpy'),
      endingSoonSpy = jasmine.createSpy('endingSoonSpy'),
      videoDuration = 20000,
      cuesHandlerInterval = 100,
      playerProps;

    var pool = playersPoolMock(function(props, player) {
      playerProps = props;
      playerProps.duration = videoDuration / 1000;
      fadeOutSpy = player.fadeOut.and.callFake(function(config) {
        return new Promise(function(success) {
          setTimeout(success, config.duration);
        });
      });
      return player;
    });

    var slot = playbackSlotWithDefaults(constant({
      playersPool: pool,
      transitionDuration: videoDuration / 4,
      cues: {
        endingSoon: {
          time: function(duration) {
            return duration * 2 / 4;
          }, callback: endingSoonSpy
        },
        ending: {
          time: function(duration) {
            return duration * 3 / 4;
          }, callback: endingSpy
        }
      }
    }));

    slot.load().then(function() {

      jasmine.clock().install();

      slot.start();

      enqueueMicrotask(function() {
        // we are going to execute 3 "cues handler" cycles each time with a different currentTime value

        playerProps.currentTime = playerProps.duration * 1 / 4;
        jasmine.clock().tick(cuesHandlerInterval);
        expect(endingSoonSpy).not.toHaveBeenCalled();
        expect(endingSpy).not.toHaveBeenCalled();

        playerProps.currentTime = playerProps.duration * 2.1 / 4;
        jasmine.clock().tick(cuesHandlerInterval);
        expect(endingSoonSpy).toHaveBeenCalled();
        expect(endingSpy).not.toHaveBeenCalled();

        playerProps.currentTime = playerProps.duration * 3.1 / 4;
        jasmine.clock().tick(cuesHandlerInterval);
        expect(endingSpy).toHaveBeenCalled();

        expect(endingSoonSpy.calls.count()).toEqual(1);
        expect(endingSpy.calls.count()).toEqual(1);

        jasmine.clock().uninstall();

        done();
      });
    });
  });
});