import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const redisConfig = {
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis max retries reached. Giving up...');
        return new Error('Redis max retries reached');
      }
      return Math.min(retries * 100, 3000);
    }
  }
};

console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  REDIS_URL: process.env.REDIS_URL,
  isProduction
});

console.log('Redis Configuration:', redisConfig);

// Redis client
export const client = createClient(redisConfig);

let isConnected = false;

// Redis connection
export async function initializeRedis() {
  try {
    if (!isConnected) {
      console.log('Attempting to connect to Redis...');
      await client.connect();
      isConnected = true;
      console.log('Redis Client Connected Successfully');
    }
    return { redisConnected: true };
  } catch (error) {
    console.error('Redis Client Error:', error);
    isConnected = false;
    return { redisConnected: false };
  }
}

// Redis client events
client.on('error', (err) => {
  console.error('Redis Client Error:', err);
  isConnected = false;
});

client.on('connect', () => {
  console.log('Redis Client Connected');
  isConnected = true;
});

client.on('reconnecting', () => {
  console.log('Redis Client Reconnecting');
  isConnected = false;
});

client.on('ready', () => {
  console.log('Redis Client Ready');
  isConnected = true;
});

client.on('end', () => {
  console.log('Redis Client Connection Ended');
  isConnected = false;
});

// connection status
export const isRedisConnected = () => isConnected; 