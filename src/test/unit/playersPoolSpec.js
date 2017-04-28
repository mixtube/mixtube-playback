/* globals jasmine */

'use strict';

var defer = require('lodash/defer'),
  playersPool = require('../../main/playersPool'),
  playerFactoryMock = require('./playerFactoryMock'),

  describe = jasmine.getEnv().describe,
  beforeEach = jasmine.getEnv().beforeEach,
  afterEach = jasmine.getEnv().afterEach,
  it = jasmine.getEnv().it,
  expect = jasmine.getEnv().expect;

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
    _pool = playersPool({playerFactory: _playerFactoryMock, max: Infinity});
  });

  afterEach(function() {
    _playerFactoryMock = _pool = null;
  });

  it('delivers a player', function(done) {
    _pool.getPlayer('mock')
      .then(function(player) {
        expect(player).toBeDefined();
        done();
      });
  });

  it('recycles a player when freed', function(done) {
    _pool.getPlayer('mock')
      .then(function(playerFirst) {
        expect(playerFirst).toBeDefined();
        _pool.releasePlayer(playerFirst);
        _pool.getPlayer('mock')
          .then(function(player) {
            expect(playerFirst).toEqual(player);
            done();
          });
      });
  });

  it('make caller waits until there is free player', function(done) {
    var callsOrder = [],
      poolSmall = playersPool({playerFactory: _playerFactoryMock, max: 1});

    poolSmall.getPlayer('mock')
      .then(function getPlayer1(playerFirst) {
        callsOrder.push(getPlayer1);

        expect(playerFirst).toBeDefined();

        poolSmall.getPlayer('mock')
          .then(function getPlayer2(player) {
            callsOrder.push(getPlayer2);

            expect(callsOrder).toEqual([getPlayer1, release, getPlayer2]);
            expect(playerFirst).toEqual(player);

            done();
          });

        // make ure the only call release when the current stack is cleared
        // it ensures that the second call to get player won't be executed straight and allow to check ordering
        defer(release);

        function release() {
          callsOrder.push(release);
          poolSmall.releasePlayer(playerFirst);
        }
      });
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

    it('when a foreign player instance freed', function(done) {
      var poolForeign = playersPool({playerFactory: _playerFactoryMock, max: Infinity});

      poolForeign.getPlayer('mock').then(function(foreignPlayer) {
        expect(function() {
          _pool.releasePlayer(foreignPlayer);
        }).toThrow();

        done();
      });
    });
  });
});