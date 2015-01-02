'use strict';

/**
 * @returns {PlayerFactoryMock}
 */
function playerFactoryMock() {

  /**
   * @typedef PlayerFactoryMock
   * @name PlayerFactoryMock
   */
  var PlayerFactoryMock = {
    canCreatePlayer: jasmine.createSpy('canCreatePlayerSpy'),
    newPlayer: jasmine.createSpy('newPlayerSpy')
  };

  return Object.freeze(PlayerFactoryMock);
}

module.exports = playerFactoryMock;
