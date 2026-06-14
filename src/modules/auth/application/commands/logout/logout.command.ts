import { ICommand } from '@/common/cqrs'

export class LogoutCommand implements ICommand {
  public readonly name = 'LogoutCommand'
  constructor(
    public readonly userId: string,
    public readonly refreshToken?: string,
  ) {}
}
