import { ICommand, CommandOptions } from '@/common/cqrs'

export class LoginCommand implements ICommand {
  readonly name = 'LoginCommand'
  readonly options: CommandOptions = { transactional: true, retryable: true }
  constructor(
    public email: string,
    public password: string,
    public ipAddress?: string,
    public userAgent?: string,
  ) {}
}
