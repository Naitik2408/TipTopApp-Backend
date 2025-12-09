const cache = require('../utils/cache');
const logger = require('../utils/logger');

/**
 * Cache middleware factory
 * Caches GET requests based on URL and query parameters
 * @param {number} ttl - Time to live in seconds (default: 5 minutes)
 * @param {string} keyPrefix - Prefix for cache key
 */
const cacheMiddleware = (ttl = 300, keyPrefix = 'api') => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key from URL and query params
      const cacheKey = `${keyPrefix}:${req.originalUrl}`;

      // Try to get cached response
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        logger.debug(`Cache HIT: ${cacheKey}`);
        return res.status(200).json(cachedData);
      }

      logger.debug(`Cache MISS: ${cacheKey}`);

      // Store original res.json
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = function (data) {
        // Only cache successful responses
        if (res.statusCode === 200) {
          cache.set(cacheKey, data, ttl).catch((err) => {
            logger.error('Cache set error:', err);
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Invalidate cache by pattern
 * @param {string} pattern - Pattern to match keys (e.g., 'menu:*')
 */
const invalidateCache = async (pattern) => {
  try {
    await cache.delPattern(pattern);
    logger.info(`Cache invalidated: ${pattern}`);
  } catch (error) {
    logger.error('Cache invalidation error:', error);
  }
};

/**
 * Invalidate specific cache key
 * @param {string} key - Cache key to invalidate
 */
const invalidateCacheKey = async (key) => {
  try {
    await cache.del(key);
    logger.info(`Cache key invalidated: ${key}`);
  } catch (error) {
    logger.error('Cache key invalidation error:', error);
  }
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  invalidateCacheKey,
};
