import { EventEmitter } from 'events';

/**
 * Per-command middleware options.
 * Each command declares which cross-cutting concerns it opts into.
 * Middlewares inspect this at runtime and skip themselves if not applicable.
 */
export interface CommandOptions {
  /** Wrap the command in a DB transaction. Default: false */
  transactional?: boolean;
  /** Retry on transient infrastructure errors. Default: false */
  retryable?: boolean;
}

export interface ICommand {
  readonly name: string;
  readonly options?: CommandOptions;
}

export interface ICommandHandler<T extends ICommand, R = any> {
  execute(command: T): Promise<R>;
}

export type NextFn<R = any> = () => Promise<R>;

export interface ICommandMiddleware {
  execute<T extends ICommand, R = any>(command: T, next: NextFn<R>): Promise<R>;
}

export class CommandBus {
  private handlers = new Map<string, ICommandHandler<any, any>>();
  private middlewares: ICommandMiddleware[] = [];

  use(middleware: ICommandMiddleware) {
    this.middlewares.push(middleware);
  }

  register(commandName: string, handler: ICommandHandler<any, any>) {
    this.handlers.set(commandName, handler);
  }

  async execute<T extends ICommand, R = any>(command: T): Promise<R> {
    const handler = this.handlers.get(command.name);
    if (!handler) {
      throw new Error(`Command handler not found for command: ${command.name}`);
    }

    let index = -1;
    const dispatch = async (i: number): Promise<R> => {
      if (i <= index) throw new Error('next() called multiple times');
      index = i;

      if (i < this.middlewares.length) {
        const middleware = this.middlewares[i];
        return middleware.execute(command, () => dispatch(i + 1));
      } else {
        return handler.execute(command);
      }
    };

    return dispatch(0);
  }
}

export interface IEvent {
  readonly name: string;
}

export interface IEventHandler<T extends IEvent> {
  handle(event: T): Promise<void> | void;
}

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
