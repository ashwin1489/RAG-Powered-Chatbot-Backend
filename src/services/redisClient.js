const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL;

const redis = new Redis(redisUrl, {
  tls: {} // 👈 enables TLS, required for Upstash
});

redis.on('connect', () => console.log('✅ Connected to Redis'));
redis.on('error', (e) => console.error('❌ Redis error', e));

module.exports = {
  rpush: (key, val) => redis.rpush(key, val),
  lrange: (key, start, stop) => redis.lrange(key, start, stop),
  del: (key) => redis.del(key),
  expire: (key, seconds) => redis.expire(key, seconds),
  rawClient: redis
};
