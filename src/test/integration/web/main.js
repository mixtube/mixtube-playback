'use strict';

var playback = require('../../../main/playback');

var _stageElmt = document.querySelector('.stage');

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
    }
  });

_playback.skip(_entries[0]);
_playback.play();
