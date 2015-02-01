/* globals jasmine */

'use strict';

/**
 * @param {function(Object.<string>, Player):Player} interceptor
 * @returns {PlayersPoolMock}
 */
function playersPoolMock(interceptor) {

  interceptor = interceptor || function(props, player) {
    return player;
  };

  function getPlayer() {

    var props = {
      provider: 'mock',
      duration: 0,
      currentTime: 0
    };

    var player = {
      get provider() {
        return props.provider;
      },
      get duration() {
        return props.duration;
      },
      get currentTime() {
        return props.currentTime;
      },
      loadById: jasmine.createSpy('loadByIdSpy').and.returnValue(Promise.resolve()),
      play: jasmine.createSpy('playSpy'),
      stop: jasmine.createSpy('stopSpy'),
      fadeIn: jasmine.createSpy('fadeInSpy'),
      fadeOut: jasmine.createSpy('fadeOutSpy').and.returnValue(Promise.resolve())
    };

    return interceptor(props, player);
  }

  /**
   * @typedef PlayersPoolMock
   * @name PlayersPoolMock
   */
  var PlayersPoolMock = {
    getPlayer: jasmine.createSpy('getPlayerSpy').and.callFake(getPlayer),
    releasePlayer: jasmine.createSpy('releasePlayerSpy')
  };

  return Object.freeze(PlayersPoolMock);
}

module.exports = playersPoolMock;