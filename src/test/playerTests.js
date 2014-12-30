'use strict';

var playersPool = require('../main/playersPool'),
  playbackSlot = require('../main/playbackSlot'),
  defaults = require('lodash-node/modern/objects/defaults'),
  assign = require('lodash-node/modern/objects/assign'),
  noop = require('lodash-node/modern/utilities/noop');

function PlayerFactoryMockBuilder() {

  var loadByIdImpl =
    jasmine.createSpy('loadById')
      .and.returnValue(new Promise(noop));

  var builder = {
    withLoadById: function(impl) {
      loadByIdImpl = impl;
      return builder;
    },

    build: function() {
      return {
        canCreatePlayer: function(provider) {
          return provider === 'mock';
        },
        newPlayer: function(provider) {
          return {
            get provider() {
              return provider;
            },
            loadById: loadByIdImpl,
            play: jasmine.createSpy('play'),
            stop: jasmine.createSpy('stop'),
            fadeIn: jasmine.createSpy('fadeIn'),
            fadeOut: jasmine.createSpy('fadeOut')
          };
        }
      };
    }
  };

  return builder;
}

function always(promise, cb) {
  promise.then(cb, function(err) {
    cb();
    Promise.reject(err);
  })
}

describe('A player pool', function() {

  var _playerFactoryMock,
    _pool;

  beforeEach(function() {
    _playerFactoryMock = PlayerFactoryMockBuilder().build();
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
      playersPool: playersPool({playerFactory: PlayerFactoryMockBuilder().build()}),
      entry: {mockMedia: {mediaSource: 'mock', mediaKey: 'mockId'}},
      videoFetcher: function(entry) {
        return {
          provider: entry.mockMedia.mediaSource,
          id: entry.mockMedia.mediaKey
        };
      },
      cues: {
        endingSoon: jasmine.createSpy('endingSoon'),
        ending: jasmine.createSpy('ending')
      },
      transitionDuration: 0
    };

    return playbackSlot(defaults({}, config, defaultConfig));
  }

  it('calls videoFetcher with the given entry when load is called', function() {

    var entryMock = {};
    var videoFetcherSpy = jasmine
      .createSpy('videoFetcherSpy')
      .and.returnValue({provider: 'mock', id: 'mockId'});

    var slot = playerSlotMock({
      entry: entryMock,
      videoFetcher: videoFetcherSpy
    });

    slot.load();

    expect(videoFetcherSpy).toHaveBeenCalledWith(entryMock);
  });

  it('returns and resolves the promise when a call to load is successful', function(done) {

    var factory = PlayerFactoryMockBuilder()
      .withLoadById(function() {
        return Promise.resolve();
      })
      .build();

    var slot = playerSlotMock({
      playersPool: playersPool({playerFactory: factory})
    });

    var loadSuccessSpy = jasmine.createSpy('loadSuccessSpy');

    always(slot.load().then(loadSuccessSpy), function() {
      expect(loadSuccessSpy).toHaveBeenCalled();
      done();
    });
  });

  describe('when a call to load is unsuccessful', function() {

    var _factory,
      _pool;

    beforeEach(function() {
      _factory = PlayerFactoryMockBuilder()
        .withLoadById(function() {
          return Promise.reject();
        })
        .build();

      _pool = playersPool({playerFactory: _factory});
    });

    it('returns and reject the promise', function(done) {
      var loadFailSpy = jasmine.createSpy('loadFailSpy');
      var slot = playerSlotMock({playersPool: _pool});

      always(slot.load().then(null, loadFailSpy), function() {
        expect(loadFailSpy).toHaveBeenCalled();
        done();
      });
    });

    it('ends the slot properly', function(done) {
      var releasePlayerSpy = jasmine.createSpy('releasePlayerSpy');
      var endingSoonSpy = jasmine.createSpy('endingSoonSpy');
      var endingSpy = jasmine.createSpy('endingSpy');
      var slot = playerSlotMock({
        playersPool: assign({}, _pool, {releasePlayer: releasePlayerSpy}),
        cues: {
          endingSoon: endingSoonSpy,
          ending: endingSpy
        }
      });

      always(slot.load(), function() {
        expect(releasePlayerSpy).toHaveBeenCalled();

        // should not call ending soon I think
        expect(endingSoonSpy).toHaveBeenCalled();
        expect(endingSpy).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('triggers an error', function() {
    it('when start is called before load', function() {

      var slot = playerSlotMock();

      expect(function() {
        slot.start();
      }).toThrow();
    });
  });

});