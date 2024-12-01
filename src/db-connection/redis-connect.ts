import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config({ path: __dirname + "/./../../.env" });

// Redis Client
const client: RedisClientType = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT as string)
    }
});

client.connect()
  .then(() => console.log('Redis client connected'))
  .catch((err) => console.error('Redis connection error', err))

export default client;