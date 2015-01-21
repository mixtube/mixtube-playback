'use strict';

var playback = require('../../main/playback'),
  delay = require('lodash-node/modern/functions/delay'),
  identity = require('lodash-node/modern/utilities/identity'),
  defaults = require('lodash-node/modern/objects/defaults'),
  describe = jasmine.getEnv().describe,
  beforeEach = jasmine.getEnv().beforeEach,
  afterEach = jasmine.getEnv().afterEach,
  it = jasmine.getEnv().it,
  ONE_HOUR = 1000 * 60 * 60,
  ONE_SECOND = 1000;

describe('Mixtube Playback', function() {

  var _stageElmt,
    _entries = Object.freeze(
      ['0KSOMA3QBU0', 'NUsoVlDFqZg', 'o3mP3mJDL2k', '7-7knsP2n5w', 'hiP14ED28CA', '2vjPBrBU-TM']
        .map(function(videoId) {
          return {id: videoId, provider: 'youtube'};
        }));

  function playbackWithDefaults(inter) {
    inter = inter || identity;

    var defaultTransitionDuration = 2000;

    var defaultConfig = {
      elementProducer: function defaultElementProducer() {
        var elmt = document.createElement('div');
        elmt.classList.add('player-wrapper');
        _stageElmt.appendChild(elmt);
        return elmt;
      },
      // special case where the entry is directly the video (easier for test)
      videoProducer: identity,
      nextEntryProducer: function defaultNextEntryProducer(entry) {
        var idx = _entries.indexOf(entry);
        if (idx === -1 || idx + 1 === _entries.length) {
          return null;
        }

        return _entries[idx + 1];
      },
      transitionDuration: defaultTransitionDuration,
      comingNext: function defaultComingNext(currentVideo, nextVideo) {
        console.group('comingNext called');
        console.log('current %o', currentVideo);
        console.log('next %o', nextVideo);
        console.groupEnd();
      },
      debug: {
        mediaDuration: (2 * defaultTransitionDuration + 2000) / 1000,
        mediaQuality: 'low'
      }
    };

    return playback(defaults({}, inter(defaultConfig), defaultConfig));
  }

  beforeEach(function() {
    _stageElmt = document.createElement('div');
    _stageElmt.classList.add('stage');
    document.body.appendChild(_stageElmt);
  });

  afterEach(function() {
    document.body.removeChild(_stageElmt);
  });


  it('plays a playlist', function(done) {

    var pb = playbackWithDefaults(function() {
      return {
        stateChanged: function(prevState, state) {
          if (state === playback.States.stopped) {
            done();
          }
        }
      };
    });

    pb.skip(_entries[0]);
    pb.play();

  }, ONE_HOUR);

  it('plays the the last skipped to video when skip occurred while paused', function(done) {

    var pb = playbackWithDefaults(function() {
      return {
        stateChanged: function(prevState, state) {
          if (state === playback.States.stopped) {
            done();
          }
        }
      };
    });

    pb.play();
    pb.skip(_entries[0]);

    delay(function() {
      pb.pause();
      pb.skip(_entries[1]);

      delay(function() {
        pb.skip(_entries[3]);

        delay(function() {
          pb.play();
        }, ONE_SECOND);
      }, ONE_SECOND);
    }, ONE_SECOND);


  }, ONE_HOUR);

});