import { createClient } from 'redis';

const client = createClient();

client.on('error', (err) => console.error('Redis Client Error', err));

async function initializeRedis() {
  try {
    await client.connect();
    console.log('Connected to Redis');
    return { redisClient: client, redisConnected: true };
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
    return { redisClient: null, redisConnected: false };
  }
}

export { client, initializeRedis };