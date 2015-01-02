'use strict';

var playersPool = require('../main/playersPool'),
  playerFactory = require('../main/playerFactory'),
  playbackSlot = require('../main/playbackSlot'),
  delay = require('lodash-node/modern/functions/delay');

var fadeDuration = 2000;

var factory = playerFactory({
  elementProducer: function() {
    var placeHolder = document.createElement('div');
    document.body.appendChild(placeHolder);
    return placeHolder;
  }
});

var pool = playersPool({
  playerFactory: factory
});

function trigger(btnId, handler) {
  document.getElementById(btnId).addEventListener('click', handler);
}

trigger('test-pool-btn', function() {
  setInterval(function() {
    var player = pool.getPlayer('youtube');
    player
      .loadById('iQWtZd8jM3g')
      .then(function() {
        player.play({audioGain: .2});
        player
          .fadeIn({duration: fadeDuration})
          .then(function() {
            // play for 1 second then fade out an stop
            delay(function() {
              player.fadeOut({duration: fadeDuration}).then(function() {
                player.stop();
                pool.releasePlayer(player);
              });
            }, 1000);
          });
      })
      .catch(function(e) {
        pool.releasePlayer(player);
        console.error(e);
      });
  }, 3000)
});

trigger('test-transition-btn', function() {
  var player = pool.getPlayer('youtube');
  player
    .loadById('iQWtZd8jM3g')
    .then(function() {
      player.play({audioGain: 1});
      player.fadeIn({duration: fadeDuration});

      // don't let the fade in finish and interrupt it with a fade out
      delay(function() {
        player.fadeOut({duration: fadeDuration}).then(function() {
          player.stop();
          pool.releasePlayer(player);
        });
      }, fadeDuration / 2);

    })
    .catch(function(e) {
      pool.releasePlayer(player);
      console.error(e);
    });
});

trigger('test-slot-btn', function() {
  setInterval(function() {
    var slot = playbackSlot({
      playersPool: pool,
      entry: {video: {provider: 'youtube', id: 'iQWtZd8jM3g'}},
      fetchVideo: function(entry) {
        return entry.video;
      },
      cues: {
        endingSoon: function() {
          console.info('About to end');
        },
        ending: function() {
          console.info('End');
        }
      },
      autoEndTimeProducer: function(duration) {
        return duration - 1000;
      },
      transitionDuration: fadeDuration
    });

    slot.load();

    // this delay is just to test the "re-entrance" of the load method
    delay(function() {
      slot
        .load()
        .then(function() {
          slot.start({audioGain: 1});

          // end the slot 500ms after the transition is finished
          delay(function() {
            slot.end();
          }, fadeDuration + 500);
        })
        .catch(function(e) {
          console.error(e);
        });
    }, 500);
  }, 5000);
});