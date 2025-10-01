import { EventEmitter } from 'events';
import { createClient, RedisClientType } from 'redis';

export type AppEvent =
  | { type: 'contentUpdated'; payload: { contentPieceId: number; campaignId: number; status?: string } }
  | { type: 'aiGenerationCreated'; payload: { contentPieceId: number; campaignId: number; generationId: number } }
  | { type: 'aiAnalysisCreated'; payload: { contentPieceId: number; campaignId: number; generationId: number; analysis: any } }
  | { type: 'translationCreated'; payload: { contentPieceId: number; campaignId: number; translationId: number; language: string } }
  | { type: 'reviewCreated'; payload: { contentPieceId: number; campaignId: number; reviewId: number; status: string } }
  | { type: 'campaignCreated'; payload: { campaignId: number } }
  | { type: 'campaignUpdated'; payload: { campaignId: number } }
  | { type: 'campaignDeleted'; payload: { campaignId: number } };

class RedisEventBus extends EventEmitter {
  private publisher: RedisClientType;
  private subscriber: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    super();
    
    // Skip Redis setup in test environment
    if (process.env.NODE_ENV === 'test') {
      this.isConnected = false;
      return;
    }
    
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.publisher = createClient({ url: redisUrl });
    this.subscriber = createClient({ url: redisUrl });
    
    this.initialize();
  }

  private async initialize() {
    try {
      await this.publisher.connect();
      await this.subscriber.connect();
      
      console.log('✅ Redis EventBus connected');
      this.isConnected = true;

      // Subscribe to all app events
      await this.subscriber.pSubscribe('app:*', (message, channel) => {
        try {
          const event = JSON.parse(message) as AppEvent;
          const eventType = channel.replace('app:', '');
          
          // Emit to local EventEmitter for backward compatibility
          this.emit(eventType, event.payload);
          this.emit('message', event);
        } catch (error) {
          console.error('Error parsing Redis event:', error);
        }
      });
      
    } catch (error) {
      console.error('❌ Failed to connect to Redis EventBus:', error);
      this.isConnected = false;
    }
  }

  async emitEvent(event: AppEvent) {
    console.log('📢 Redis EventBus emitting:', event.type, 'payload:', event.payload);
    
    // Only publish to Redis - let Redis subscription handle the local emission
    // This prevents double emission (local + Redis subscription)
    if (this.isConnected) {
      try {
        await this.publisher.publish(`app:${event.type}`, JSON.stringify(event));
        console.log('✅ Redis EventBus published:', event.type, 'to Redis');
      } catch (error) {
        console.error('❌ Error publishing to Redis:', error);
        // Fall back to local emission only if Redis fails
        this.emit(event.type, event.payload);
        this.emit('message', event);
      }
    } else {
      console.log('⚠️  Redis EventBus not connected, local emit only');
      // Only emit locally if Redis is not connected
      this.emit(event.type, event.payload);
      this.emit('message', event);
    }
  }

  async disconnect() {
    if (this.isConnected && this.publisher && this.subscriber) {
      try {
        await this.publisher.disconnect();
        await this.subscriber.disconnect();
        this.isConnected = false;
        console.log('🔌 Redis EventBus disconnected');
      } catch (error) {
        // Ignore disconnection errors
        console.log('ℹ️  Redis EventBus disconnect completed with warnings');
      }
    }
  }
}

export const redisEventBus = new RedisEventBus();