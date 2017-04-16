'use strict';

var isString = require('lodash/isString'),
  isArray = require('lodash/isArray');

/**
 * @param {Array.<string>} names
 * @returns {Object.<string, Object>}
 */
function enumeration(names) {
  if (!isArray(names)) {
    throw new TypeError('The given arguments should be an array but found' + typeof names);
  }

  var Enumeration = {};

  names.forEach(function(name) {

    if (!isString(name)) {
      throw new TypeError('Each given item should be a string but found ' + typeof name);
    }

    var constant = Object.freeze({
      toString: function() {
        return name;
      }
    });

    Object.defineProperty(Enumeration, name, {
      get: function() {
        return constant;
      }
    });
  });

  return Object.freeze(Enumeration);
}

module.exports = enumeration;