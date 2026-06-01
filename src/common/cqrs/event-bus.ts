import { EventEmitter } from 'events';
import { IEvent } from './interfaces/event.interface';
import { IEventHandler } from './interfaces/event-handler.interface';

export class EventBus {
  private emitter = new EventEmitter();

  register<T extends IEvent>(eventName: string, handler: IEventHandler<T>) {
    this.emitter.on(eventName, async (event: T) => {
      try {
        await handler.handle(event);
      } catch (error) {
        console.error(`Error handling event ${eventName}:`, error);
      }
    });
  }

  publish(event: IEvent) {
    this.emitter.emit(event.name, event);
  }
}
