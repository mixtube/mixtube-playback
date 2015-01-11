'use strict';

/**
 * @returns {PlaybackSlotMock}
 */
function playbackSlotMock(props) {

  props = props || {
    entry: {},
    video: {provider: 'mock', id: 'mock'}
  };

  /**
   * @typedef PlaybackSlotMock
   * @name PlaybackSlotMock
   */
  var PlaybackSlotMock = {
    /**
     * @return {Entry}
     */
    get entry() {
      return props.entry
    },
    /**
     * @returns {Video}
     */
    get video() {
      return props.video;
    },
    load: jasmine.createSpy('loadSpy'),
    start: jasmine.createSpy('startSpy'),
    end: jasmine.createSpy('endSpy'),
    suspend: jasmine.createSpy('suspendSpy'),
    proceed: jasmine.createSpy('proceedSpy')
  };

  return Object.freeze(PlaybackSlotMock);
}

module.exports = playbackSlotMock;
