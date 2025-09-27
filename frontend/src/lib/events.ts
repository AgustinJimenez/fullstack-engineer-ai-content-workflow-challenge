export type EventHandler = (data: any) => void;

export class SSEClient {
  private url: string;
  private es: EventSource | null = null;
  private handlers: Record<string, Set<EventHandler>> = {};
  private backoff = 1000;
  private maxBackoff = 15000;
  private closed = false;

  constructor(url: string) {
    this.url = url;
    this.connect();
  }

  private connect() {
    if (this.closed) return;
    this.es = new EventSource(this.url);

    this.es.onopen = () => {
      this.backoff = 1000; // reset backoff on successful connect
    };

    this.es.onerror = () => {
      this.es?.close();
      this.es = null;
      if (this.closed) return;
      setTimeout(() => this.connect(), this.backoff);
      this.backoff = Math.min(this.backoff * 2, this.maxBackoff);
    };

    const dispatch = (type: string) => (e: MessageEvent) => {
      const set = this.handlers[type];
      if (!set || set.size === 0) return;
      try {
        const data = JSON.parse(e.data);
        set.forEach((h) => h(data));
      } catch {
        // ignore parse errors
      }
    };

    const knownEvents = [
      'connected',
      'contentUpdated',
      'aiGenerationCreated',
      'translationCreated',
      'reviewCreated',
      'campaignCreated',
      'campaignUpdated',
      'campaignDeleted',
    ];

    knownEvents.forEach((evt) => this.es?.addEventListener(evt, dispatch(evt)));
  }

  on(event: string, handler: EventHandler) {
    if (!this.handlers[event]) this.handlers[event] = new Set();
    this.handlers[event].add(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: EventHandler) {
    this.handlers[event]?.delete(handler);
  }

  close() {
    this.closed = true;
    this.es?.close();
    this.es = null;
  }
}

export function createSSEClient(baseUrl?: string) {
  const url = `${baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/events/stream`;
  return new SSEClient(url);
}

