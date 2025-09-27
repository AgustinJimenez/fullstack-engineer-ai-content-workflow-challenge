import { EventEmitter } from 'events';

export type AppEvent =
  | { type: 'contentUpdated'; payload: { contentPieceId: number; campaignId: number; status?: string } }
  | { type: 'aiGenerationCreated'; payload: { contentPieceId: number; campaignId: number; generationId: number } }
  | { type: 'aiAnalysisCreated'; payload: { contentPieceId: number; campaignId: number; generationId: number; analysis: any } }
  | { type: 'translationCreated'; payload: { contentPieceId: number; campaignId: number; translationId: number; language: string } }
  | { type: 'reviewCreated'; payload: { contentPieceId: number; campaignId: number; reviewId: number; status: string } }
  | { type: 'campaignCreated'; payload: { campaignId: number } }
  | { type: 'campaignUpdated'; payload: { campaignId: number } }
  | { type: 'campaignDeleted'; payload: { campaignId: number } };

class EventBus extends EventEmitter {
  emitEvent(event: AppEvent) {
    this.emit(event.type, event.payload);
    // Also emit a generic message
    this.emit('message', event);
  }
}

export const eventBus = new EventBus();
