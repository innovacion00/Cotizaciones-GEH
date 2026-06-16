import { EventEmitter } from 'events';

class EventBus extends EventEmitter {
  emit(event, payload) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EventBus] ${event}`, payload ? JSON.stringify(payload).slice(0, 120) : '');
    }
    return super.emit(event, payload);
  }
}

export const eventBus = new EventBus();
