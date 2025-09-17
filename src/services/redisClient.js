const Redis = require('ioredis');
const url = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(url);

redis.on('connect', () => console.log('Connected to Redis'));
redis.on('error', (e) => console.error('Redis error', e));

module.exports = {
  rpush: (key, val) => redis.rpush(key, val),
  lrange: (key, start, stop) => redis.lrange(key, start, stop),
  del: (key) => redis.del(key),
  expire: (key, seconds) => redis.expire(key, seconds),
  rawClient: redis
};
