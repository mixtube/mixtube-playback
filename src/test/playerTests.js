'use strict';

var playersPool = require('../main/playersPool'),
  playbackSlot = require('../main/playbackSlot'),
  playerFactoryMock = require('./playerFactoryMock'),
  playersPoolMock = require('./playersPoolMock'),
  defaults = require('lodash-node/modern/objects/defaults'),
  constant = require('lodash-node/modern/utilities/constant');

function always(promise, cb) {
  promise.then(cb, function(err) {
    cb();
    return Promise.reject(err);
  })
}

describe('A player pool', function() {

  var _playerFactoryMock,
    _pool;

  beforeEach(function() {
    _playerFactoryMock = playerFactoryMock();
    _playerFactoryMock.canCreatePlayer.and.callFake(function(provider) {
      return provider === 'mock';
    });
    _playerFactoryMock.newPlayer.and.callFake(function(provider) {
      return {provider: provider};
    });
    _pool = playersPool({playerFactory: _playerFactoryMock});
  });

  afterEach(function() {
    _playerFactoryMock = _pool = null;
  });

  it('delivers a player', function() {
    expect(_pool.getPlayer('mock')).toBeDefined();
  });

  it('recycles a player when freed', function() {
    var playerFirst = _pool.getPlayer('mock');

    expect(playerFirst).toBeDefined();
    _pool.releasePlayer(playerFirst);
    expect(playerFirst).toEqual(_pool.getPlayer('mock'));
  });

  describe('triggers an error', function() {
    it('when no provider is specified', function() {
      expect(function() {
        _pool.getPlayer();
      }).toThrow();
    });

    it('when a not supported provider is specified', function() {
      expect(function() {
        _pool.getPlayer('notSupportedProvider');
      }).toThrow();
    });

    it('when a foreign player instance freed', function() {
      var poolForeign = playersPool({playerFactory: _playerFactoryMock});
      expect(function() {
        _pool.releasePlayer(poolForeign.getPlayer('mock'));
      }).toThrow();
    });
  });
});

describe('A player slot', function() {

  function playerSlotMock(config) {
    var defaultConfig = {
      entry: {mockMedia: {mediaSource: 'mock', mediaKey: 'mockId'}},
      videoFetcher: function(entry) {
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

    return playbackSlot(defaults({}, config, defaultConfig));
  }

  it('calls videoFetcher with the given entry when load is called', function() {

    var entryMock = {};
    var videoFetcherSpy = jasmine
      .createSpy('videoFetcherSpy')
      .and.returnValue({provider: 'mock', id: 'mockId'});

    var pool = playersPoolMock();

    var slot = playerSlotMock({
      playersPool: pool,
      entry: entryMock,
      videoFetcher: videoFetcherSpy
    });

    slot.load();

    expect(videoFetcherSpy).toHaveBeenCalledWith(entryMock);
  });

  it('returns and resolves the promise', function(done) {
    var pool = playersPoolMock();
    var loadSuccessSpy = jasmine.createSpy('loadSuccessSpy');

    var slot = playerSlotMock({playersPool: pool});

    always(slot.load().then(loadSuccessSpy), function() {
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

    var slot = playerSlotMock({
      playersPool: pool,
      transitionDuration: transitionDuration
    });

    slot.load().then(function() {
      var config = {audioGain: 0};
      slot.start(config);

      expect(playSpy).toHaveBeenCalledWith(config);
      expect(fadeInSpy).toHaveBeenCalledWith({duration: transitionDuration});

      slot.end();

      done();
    });
  });

  describe('when a call to load is unsuccessful', function() {

    it('returns and reject the promise', function(done) {
      var loadFailSpy = jasmine.createSpy('loadFailSpy');
      var pool = playersPoolMock(function(props, player) {
        player.loadById.and.returnValue(Promise.reject());
        return player;
      });

      var slot = playerSlotMock({playersPool: pool});

      always(slot.load().then(null, loadFailSpy), function() {
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

      var slot = playerSlotMock({
        playersPool: pool,
        cues: {
          endingSoon: {callback: endingSoonSpy},
          ending: {callback: endingSpy}
        }
      });

      always(slot.load(), function() {
        expect(pool.releasePlayer).toHaveBeenCalled();
        expect(endingSoonSpy).not.toHaveBeenCalled();
        expect(endingSpy).not.toHaveBeenCalled();
        done();
      });
    });
  });

  it('triggers an error when start is called before load', function() {

    var slot = playerSlotMock();

    expect(function() {
      slot.start();
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


    var slot = playerSlotMock({
      playersPool: pool,
      transitionDuration: transitionDuration
    });

    slot.load().then(function() {

      slot.start();

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

    var slot = playerSlotMock({
      playersPool: pool,
      transitionDuration: transitionDuration,
      cues: {
        endingSoon: {callback: endingSoonSpy, time: constant(0)},
        ending: {callback: endingSpy, time: constant(0)}
      }
    });

    slot.load().then(function() {
      slot.start();
      setTimeout(function() {
        slot.end().then(function() {

          expect(fadeOutSpy).toHaveBeenCalled();
          expect(stopSpy).toHaveBeenCalled();
          expect(endingSpy).toHaveBeenCalled();
          expect(endingSoonSpy).toHaveBeenCalled();

          done();
        });
      }, 0);
    });
  });

  it('runs "ending soon" and "ending" in schedule (auto ending)', function(done) {
    var fadeOutSpy,
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

    var slot = playerSlotMock({
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
    });

    jasmine.clock().install();

    slot.load().then(function() {

      slot.start();

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