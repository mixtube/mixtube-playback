/* global jasmine */

'use strict';

var playback = require('../../main'),
  delay = require('lodash/delay'),
  defer = require('lodash/defer'),
  identity = require('lodash/identity'),
  defaults = require('lodash/defaults'),
  last = require('lodash/last'),
  includes = require('lodash/includes'),
  describe = jasmine.getEnv().describe,
  beforeEach = jasmine.getEnv().beforeEach,
  afterEach = jasmine.getEnv().afterEach,
  it = jasmine.getEnv().it,
  expect = jasmine.getEnv().expect,
  ONE_HOUR = 1000 * 60 * 60,
  ONE_SECOND = 1000;

describe('Mixtube Playback', function() {
  function videoIdToYoutubeEntry(videoId) {
    return Object.freeze({id: videoId, provider: 'youtube'});
  }

  function defaultElementProducer() {
    var elmt = document.createElement('div');
    elmt.classList.add('player-wrapper');
    _stageElmt.appendChild(elmt);
    return elmt;
  }

  var _stageElmt,
    _entries = Object.freeze(
      ['ZW3aV7U-aik', 'jAhjPd4uNFY', 'TnzcwTyr6cE', 'QsBT5EQt348', 'X9otDixAtFw', 'sRv19gkZ4E0', 'IXxZRZxafEQ']
        .map(videoIdToYoutubeEntry)),
    _entriesBlacklisted = Object.freeze(
      ['_aPzdHSmcH0', 'gIlGnaefCck', 'iS1g8G_njx8']
        .map(videoIdToYoutubeEntry));


  beforeEach(function() {
    _stageElmt = document.createElement('div');
    _stageElmt.classList.add('stage');
    document.body.appendChild(_stageElmt);
  });

  afterEach(function() {
    document.body.removeChild(_stageElmt);
  });

  describe('engine', function() {

    function buildNextEntryProducer(entries) {
      return function arrayBasedNextEntryProducer(entry) {
        var idx = entries.indexOf(entry);
        if (idx === -1 || idx + 1 === entries.length) {
          return null;
        }

        return entries[idx + 1];
      };
    }

    function engineWithDefaults(inter) {
      inter = inter || identity;

      var defaultTransitionDuration = 2000;

      var defaultConfig = {
        elementProducer: defaultElementProducer,
        // special case where the entry is directly the video (easier for test)
        videoProducer: identity,
        nextEntryProducer: buildNextEntryProducer(_entries),
        transitionDuration: defaultTransitionDuration,
        comingNext: jasmine.createSpy('comingNextSpy').and.callFake(
          function defaultComingNext(currentVideo, nextVideo) {
            console.group('comingNext called');
            console.log({current: currentVideo, next: nextVideo});
            console.groupEnd();
          }),
        loadFailed: jasmine.createSpy('loadFailedSpy').and.callFake(
          function logLoadingErrorWarning(entry, error) {
            console.group('Skipped a entry because of an load error');
            console.warn({entry: entry, error: error});
            console.groupEnd();
          }),
        debug: {
          mediaDuration: (2 * defaultTransitionDuration + 2000) / 1000,
          mediaQuality: 'low'
        }
      };

      return playback.engine(defaults({}, inter(defaultConfig), defaultConfig));
    }

    it('plays a playlist', function(done) {

      var comingNextSpy,
        pb = engineWithDefaults(function(defaultConfig) {
          comingNextSpy = defaultConfig.comingNext;

          return {
            stateChanged: function(prevState, state) {
              if (state === playback.engine.States.stopped) {
                runChecks();
                done();
              }
            }
          };
        });

      pb.skip(_entries[0]);
      pb.play();

      function runChecks() {
        expect(comingNextSpy.calls.count()).toEqual(_entries.length + 1);
      }

    }, ONE_HOUR);

    it('plays the last skipped to video when skip occurred while paused', function(done) {

      var comingNextSpy,
        pb = engineWithDefaults(function(defaultConfig) {
          comingNextSpy = defaultConfig.comingNext;

          return {
            stateChanged: function(prevState, state) {
              if (state === playback.engine.States.stopped) {
                runChecks();
                done();
              }
            }
          };
        });

      pb.play();
      pb.skip(_entries[0]);

      delay(function() {
        pb.pause();

        delay(function() {
          pb.skip(_entries[3]);
          pb.play();

          delay(function() {
            pb.skip(last(_entries));
          }, ONE_SECOND);
        }, ONE_SECOND);
      }, ONE_SECOND);

      function runChecks() {
        expect(comingNextSpy.calls.mostRecent().args[0].id).toEqual(last(_entries).id);
      }


    }, ONE_HOUR);

    it('skips over a video that failed to load', function(done) {

      var entries = _entries.slice(0, 3);
      entries[1] = Object.assign({}, entries[1], {id: 'brokenVideoId'});

      var loadFailedSpy,
        pb = engineWithDefaults(function(defaultConfig) {
          loadFailedSpy = defaultConfig.loadFailed;

          return {
            nextEntryProducer: buildNextEntryProducer(entries),
            stateChanged: function(prevState, state) {
              if (state === playback.engine.States.stopped) {
                runChecks();
                done();
              }
            }
          };
        });

      pb.skip(_entries[0]);
      pb.play();

      function runChecks() {
        expect(loadFailedSpy).toHaveBeenCalled();
        expect(loadFailedSpy.calls.count()).toEqual(1);
      }

    }, ONE_HOUR);
  });

  describe('DRM checker', function() {

    function drmCheckerWithDefaults() {
      return playback.drmChecker({
        elementProducer: defaultElementProducer
      });
    }

    // if run from a blacklisted domain we expect the failing entries to fail
    var shouldBeBlacklisted = includes(location.hostname, 'mixtube.io');

    var testNameBlacklistedEntries = shouldBeBlacklisted ?
      'reports not playable for videos with blacklisting on blocked hostname' :
      'reports playable even for videos with blacklisting on authorised hostname';

    it(testNameBlacklistedEntries, function(done) {
      var drmChecker = drmCheckerWithDefaults();
      var entriesToCheck = _entriesBlacklisted;

      var expectedReports = entriesToCheck.map(function() {
        return jasmine.objectContaining({playable: !shouldBeBlacklisted});
      });

      Promise
        .all(entriesToCheck.map(function(entry) {
          return drmChecker.checkDrm(entry);
        }))
        .then(function(reports) {
          expect(reports).toEqual(expectedReports);
          done();
        });
    }, ONE_HOUR);

    it('reports playable for videos without any domain blacklisting', function(done) {

      var drmChecker = drmCheckerWithDefaults();
      var entriesToCheck = _entries.slice(0, 3);

      var expectedReports = entriesToCheck.map(function() {
        return jasmine.objectContaining({playable: true});
      });

      Promise
        .all(entriesToCheck.map(function(entry) {
          return drmChecker.checkDrm(entry);
        }))
        .then(function(reports) {
          expect(reports).toEqual(expectedReports);
          done();
        });
    }, ONE_HOUR);
  });
});