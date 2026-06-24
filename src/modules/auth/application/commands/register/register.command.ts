import { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel'

export class RegisterCommand implements ICommand {
  readonly name = RegisterCommand.name
  readonly options: CommandOptions = { transactional: true, retryable: true }
  constructor(
    public email: string,
    public password: string,
    public username: string,
  ) {}
}
