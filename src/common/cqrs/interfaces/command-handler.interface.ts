import { ICommand } from './command.interface';

export interface ICommandHandler<T extends ICommand, R = any> {
  execute(command: T): Promise<R>;
}
