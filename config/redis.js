import Redis from 'redis';

const redisClient = Redis.createClient();

redisClient.on('error', (err) => console.log('Redis Client Error', err));

await redisClient.connect();

// wrapper setex
redisClient.setex = async (key, ttl, value) => {
    return redisClient.set(key, value, { EX: ttl });
};

export default redisClient;
