'use strict';

var playersPool = require('../main/playersPool'),
  delay = require('lodash-node/modern/functions/delay');

var pool = playersPool({
  fadeDuration: 5000,
  produceElement: function() {
    var placeHolder = document.createElement('div');
    document.body.appendChild(placeHolder);
    return placeHolder;
  }
});

document.getElementById('go-btn').addEventListener('click', function() {
  setInterval(function() {
    var player = pool.getPlayer('youtube');
    player
      .loadById('iQWtZd8jM3g')
      .then(function() {

        delay(function() {
          player.play({audioGain:.2});
          player
            .fadeIn()
            .then(function() {
              delay(function() {
                player.fadeOut().then(function() {
                  player.stop();
                  pool.releasePlayer(player);
                });
              }, 2000);
            });
        }, 5000);
      })
      .catch(function(e) {
        console.error(e);
      });
  }, 3000)
});