'use strict';

var playersPool = require('../main/playersPool'),
  delay = require('lodash-node/modern/functions/delay');

var fadeDuration = 5000;

var pool = playersPool({
  fadeDuration: fadeDuration,
  produceElement: function() {
    var placeHolder = document.createElement('div');
    document.body.appendChild(placeHolder);
    return placeHolder;
  }
});

document.getElementById('test-pool-btn').addEventListener('click', function() {
  setInterval(function() {
    var player = pool.getPlayer('youtube');
    player
      .loadById('iQWtZd8jM3g')
      .then(function() {
        player.play({audioGain: .2});
        player
          .fadeIn()
          .then(function() {
            // play for 1 second then fade out an stop
            delay(function() {
              player.fadeOut().then(function() {
                player.stop();
                pool.releasePlayer(player);
              });
            }, 1000);
          });
      })
      .catch(function(e) {
        console.error(e);
      });
  }, 3000)
});

document.getElementById('test-transition-btn').addEventListener('click', function() {
  var player = pool.getPlayer('youtube');
  player
    .loadById('iQWtZd8jM3g')
    .then(function() {
      player.play({audioGain: 1});
      player.fadeIn();

      // don't let the fade in finish and interrupt it with a fade out
      delay(function() {
        player.fadeOut().then(function() {
          player.stop();
          pool.releasePlayer(player);
        });
      }, fadeDuration / 2);

    })
    .catch(function(e) {
      console.error(e);
    });
})
;