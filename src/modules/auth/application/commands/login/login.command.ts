import type { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel'

export class LoginCommand implements ICommand {
  readonly name = LoginCommand.name
  readonly options: CommandOptions = { transactional: true, retryable: true }
  constructor(
    public email: string,
    public password: string,
    public ipAddress?: string,
    public userAgent?: string,
  ) {}
}
