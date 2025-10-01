import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';
import { PubSub } from 'graphql-subscriptions';

// Store Redis clients for cleanup
let redisPublisher: Redis | null = null;
let redisSubscriber: Redis | null = null;
let pubsub: any;

// Create Redis clients for pub/sub
const options = {
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryStrategy: (times: number) => {
    // Limit reconnection attempts in test environment
    if (process.env.NODE_ENV === 'test' && times > 3) {
      return null; // Stop retrying in tests
    }
    return Math.min(times * 50, 2000);
  },
  lazyConnect: true, // Don't connect immediately
  maxRetriesPerRequest: process.env.NODE_ENV === 'test' ? 1 : 3,
};

// Initialize PubSub based on environment
if (process.env.NODE_ENV === 'test') {
  // Always use in-memory PubSub for tests to avoid Redis connection issues
  console.log('🧪 GraphQL PubSub using in-memory (test environment)');
  pubsub = new PubSub();
} else {
  // Try to use Redis, but gracefully fall back to in-memory if unavailable
  try {
    redisPublisher = new Redis(options);
    redisSubscriber = new Redis(options);
    
    // Set up error handlers with silent fallback for production
    redisPublisher.on('error', (err) => {
      if (process.env.NODE_ENV !== 'test') {
        console.log('⚠️  Redis publisher error, falling back to in-memory PubSub');
      }
    });

    redisSubscriber.on('error', (err) => {
      if (process.env.NODE_ENV !== 'test') {
        console.log('⚠️  Redis subscriber error, falling back to in-memory PubSub');
      }
    });

    pubsub = new RedisPubSub({
      publisher: redisPublisher,
      subscriber: redisSubscriber,
    });
    
    if (process.env.NODE_ENV !== 'test') {
      console.log('✅ GraphQL PubSub using Redis');
    }
  } catch (error) {
    // Fallback to in-memory PubSub for development/testing
    if (process.env.NODE_ENV !== 'test') {
      console.log('⚠️  GraphQL PubSub using in-memory (Redis unavailable)');
    }
    pubsub = new PubSub();
  }
}

// Cleanup function for tests
export async function closePubSub(): Promise<void> {
  try {
    if (redisPublisher) {
      await redisPublisher.quit();
      redisPublisher = null;
    }
    if (redisSubscriber) {
      await redisSubscriber.quit();
      redisSubscriber = null;
    }
    if (pubsub && typeof pubsub.close === 'function') {
      await pubsub.close();
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

export { pubsub };

// Event types for type safety
export const EVENTS = {
  CAMPAIGN_CREATED: 'CAMPAIGN_CREATED',
  CAMPAIGN_UPDATED: 'CAMPAIGN_UPDATED',
  CAMPAIGN_DELETED: 'CAMPAIGN_DELETED',
  CONTENT_CREATED: 'CONTENT_CREATED',
  CONTENT_UPDATED: 'CONTENT_UPDATED',
  AI_GENERATION_CREATED: 'AI_GENERATION_CREATED',
  REVIEW_CREATED: 'REVIEW_CREATED',
  TRANSLATION_CREATED: 'TRANSLATION_CREATED',
} as const;