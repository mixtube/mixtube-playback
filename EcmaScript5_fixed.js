/**
 @param {Object} object
 @static
 @return {boolean}
 */
Object.isExtensible = function(object) {};
/**
 @param {Object} obj
 @static
 @return {void}
 */
Object.preventExtensions = function(obj) {};
/**
 @param {Object} obj
 @param {string} prop
 @static
 @return {Object}
 */
Object.getOwnPropertyDescriptor = function(obj,prop) {};
/**
 @param {Object} obj
 @param {string} prop
 @param {Object} desc
 @static
 @return {void}
 */
Object.defineProperty = function(obj,prop,desc) {};
/**
 @param {Object} obj
 @param {Object} props
 @static
 @return {void}
 */
Object.defineProperties = function(obj,props) {};
/**
 @param {Object} obj
 @static
 @return {Array}
 */
Object.keys = function(obj) {};
/**
 @param {Object} obj
 @static
 @return {Array}
 */
Object.getOwnPropertyNames = function(obj) {};
/**
 @param {Object} proto
 @param {Object} [props]
 @static
 @return {void}
 */
Object.create = function(proto,props) {};
/**
 @param {Object} obj
 @static
 @return {Object}
 */
Object.getPrototypeOf = function(obj) {};
/**
 @param {Object} obj
 @static
 @return {void}
 */
Object.seal = function(obj) {};
/**
 @param {Object} obj
 @static
 @return {boolean}
 */
Object.isSealed = function(obj) {};
/**
 @param {T} obj
 @static
 @return {T}
 @template T
 */
Object.freeze = function(obj) {};
/**
 @param {Object} obj
 @static
 @return {boolean}
 */
Object.isFrozen = function(obj) {};

/**
 @param {*} obj
 @static
 @return {boolean}
 */
Array.isArray = function(obj) {};
/**
 @param {function(*, *=, number=, Array.<T>=)} callback
 @param {*} [initialValue]
 @return {*}
 */
Array.prototype.reduce = function(callback,initialValue) {};
/**
 @param {function(*, *=, number=, Array.<T>=)} callback
 @param {*} [initialValue]
 @return {*}
 */
Array.prototype.reduceRight = function(callback,initialValue) {};
/**
 @param {T} searchElement
 @param {number} [fromIndex]
 @return {number}
 */
Array.prototype.indexOf = function(searchElement,fromIndex) {};
/**
 @param {T} searchElement
 @param {number} [fromIndex]
 @return {number}
 */
Array.prototype.lastIndexOf = function(searchElement,fromIndex) {};
/**
 @param {function(T=, number=, Array.<T>=)} callback
 @param {*} [thisArg]
 @return {boolean}
 */
Array.prototype.every = function(callback,thisArg) {};
/**
 @param {function(T=, number=, Array.<T>=)} callback
 @param {*} [thisArg]
 @return {Array.<T>}
 */
Array.prototype.filter = function(callback,thisArg) {};
/**
 @param {function(T=, number=, Array.<T>=)} callback
 @param {*} [thisArg]
 @return {void}
 */
Array.prototype.forEach = function(callback,thisArg) {};
/**
 @param {function(T=, number=, Array.<T>=)} callback
 @param {*} [thisArg]
 @return {Array}
 */
Array.prototype.map = function(callback,thisArg) {};
/**
 @param {function(T=, number=, Array.<T>=)} callback
 @param {*} [thisArg]
 @return {boolean}
 */
Array.prototype.some = function(callback,thisArg) {};
/**
 @template T
 @class Array
 */
Array();

/**
 @return {string}
 */
String.prototype.trim = function() {};
/**
 @return {string}
 */
String.prototype.toJSON = function() {};

/**
 @param {T} thisArg
 @param {...*} [arg]
 @return {function(this:T)}
 @template T
 */
Function.prototype.bind = function(thisArg,arg) {};

/**
 @param {*} value
 @param {Function} [replacer]
 @param {Number|String} [space]
 @static
 */
JSON.stringify = function(value,replacer,space) {};
/**
 @param {string} jsonString
 @param {Function} [reviver]
 @static
 */
JSON.parse = function(jsonString,reviver) {};
JSON = function() {};
JSON.constructor = 0;
/**
 @static
 @return {number}
 */
Date.now = function() {};
/**
 @return {string}
 */
Date.prototype.toJSON = function() {};
