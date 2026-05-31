import { ICommand, CommandOptions } from '@/common/cqrs'

export class RegisterCommand implements ICommand {
  readonly name = 'RegisterCommand'
  readonly options: CommandOptions = { transactional: true, retryable: true }
  constructor(
    public email: string,
    public password: string,
    public fullName: string,
  ) {}
}
