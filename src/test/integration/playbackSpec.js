'use strict';

var playback = require('../../main/playback'),
  describe = jasmine.getEnv().describe,
  beforeEach = jasmine.getEnv().beforeEach,
  afterEach = jasmine.getEnv().afterEach,
  it = jasmine.getEnv().it,
  ONE_HOUR = 1000 * 60 * 60;

describe('Mixtube Playback', function() {

  var _stageElmt;

  beforeEach(function() {
    _stageElmt = document.createElement('div');
    _stageElmt.classList.add('stage');
    document.body.appendChild(_stageElmt);
  });

  afterEach(function() {
    document.body.removeChild(_stageElmt);
  });

  it('plays a playlist', function(done) {

    ['0KSOMA3QBU0', 'NUsoVlDFqZg', 'o3mP3mJDL2k', '7-7knsP2n5w', 'hiP14ED28CA', '2vjPBrBU-TM']
      .map(function(videoId) {
        return {id: videoId, provider: 'youtube'};
      });

    var _entries =
        ['0KSOMA3QBU0', 'NUsoVlDFqZg', 'o3mP3mJDL2k', '7-7knsP2n5w', 'hiP14ED28CA', '2vjPBrBU-TM']
          .map(function(videoId) {
            return {id: videoId, provider: 'youtube'};
          }),

      _playback = playback({
        elementProducer: function() {
          var elmt = document.createElement('div');
          elmt.classList.add('player-wrapper');
          _stageElmt.appendChild(elmt);
          return elmt;
        },
        videoProducer: function(entry) {
          // special case where the entry is directly the video (easier for test)
          return entry;
        },
        nextEntryProducer: function(entry) {
          var idx = _entries.indexOf(entry);
          if (idx === -1 || idx + 1 === _entries.length) {
            return null;
          }

          return _entries[idx + 1];
        },
        transitionDuration: 3000,
        comingNext: function(currentVideo, nextVideo) {
          console.log('Current video %o', currentVideo);
          console.log('Next video %o', nextVideo);
        },
        stateChanged: function(prevState, state) {
          if (state === playback.States.stopped) {
            done();
          }
        }
      });

    _playback.skip(_entries[0]);
    _playback.play();
  }, ONE_HOUR);

});