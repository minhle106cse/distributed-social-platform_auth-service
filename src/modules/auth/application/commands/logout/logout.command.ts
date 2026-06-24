import { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel'

export class LogoutCommand implements ICommand {
  public readonly name = LogoutCommand.name
  readonly options: CommandOptions = { transactional: false, retryable: false }
  constructor(
    public readonly userId: string,
    public readonly refreshToken?: string,
  ) {}
}
