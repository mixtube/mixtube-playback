'use strict';

/**
 * @typedef {Object} ObjectsPoolBucket
 * @property {*} payload
 * @property {boolean} free
 */

/**
 * @typedef {Object} objectsPoolConfig
 * @property {function():*|Promise.<*>} factory
 * @property {number} max
 */

function pathBucket(bucket) {
  return bucket.payload;
}

function predicateBucketFree(bucket) {
  return bucket.free;
}

/**
 * @param {objectsPoolConfig} config
 * @returns {ObjectsPool}
 */
function objectsPool(config) {
  var factory = config.factory,
    max = config.max;

  var buckets = [];
  var waiters = [];

  function canGrow() {
    return buckets.length < max;
  }

  /**
   * @returns {ObjectsPoolBucket}
   */
  function findBucketFree() {
    return buckets.find(predicateBucketFree);
  }

  /**
   * @param {*} payload
   * @returns {ObjectsPoolBucket}
   */
  function findBucketForByPayload(payload) {
    return buckets.find(function(bucket) {
      return bucket.payload === payload;
    });
  }

  function removeBucket(bucket) {
    buckets.splice(buckets.findIndex(function(bucket_) {
      return bucket_ === bucket;
    }), 1);
  }

  /**
   * @returns {Promise.<ObjectsPoolBucket>}
   */
  function allocateBucket() {
    // allocate the bucket straight but make it not available
    var bucket = {payload: undefined, free: false};
    buckets.push(bucket);

    return Promise
      .resolve(factory())
      .then(function(payload) {
        bucket.payload = payload;
        bucket.free = true;
        return bucket;
      }).catch(function(error) {
        // in case of error we remove the bucket
        removeBucket(bucket);
        throw error;
      });
  }

  /**
   * @returns {Promise.<function(*)>}
   */
  function enqueueWaiterForBucket() {
    return new Promise(function(resolve) {
      waiters.push(resolve);
    });
  }

  /**
   * @returns {Promise.<ObjectsPoolBucket>}
   */
  function ensureBucket() {
    var bucket = findBucketFree();

    if (!bucket) {
      // cache miss
      if (!canGrow()) {
        return enqueueWaiterForBucket()
          .then(markBucketOccupied);
      }

      return allocateBucket()
        .then(markBucketOccupied);
    }

    return Promise.resolve(markBucketOccupied(bucket));
  }

  /**
   * @param {ObjectsPoolBucket} bucket
   * @returns {ObjectsPoolBucket}
   */
  function markBucketOccupied(bucket) {
    bucket.free = false;
    return bucket;
  }

  function acquire() {
    return ensureBucket().then(pathBucket);
  }

  function release(payload) {
    var bucket = findBucketForByPayload(payload);

    if (bucket === undefined) {
      throw new Error('Can not release a foreign object from a pool');
    }

    var waiter = waiters.shift();
    if (waiter !== undefined) {
      // recycle straight if someone is waiting
      waiter(bucket);
    } else {
      bucket.free = true;
    }
  }

  /**
   * @typedef ObjectsPool
   * @name ObjectsPool
   */
  var ObjectsPool = {
    acquire: acquire,
    release: release
  };

  return Object.freeze(ObjectsPool);
}

module.exports = objectsPool;