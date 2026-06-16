import { ICommand } from '@/common/cqrs'

export class LogoutCommand implements ICommand {
  public readonly name = LogoutCommand.name
  constructor(
    public readonly userId: string,
    public readonly refreshToken?: string,
  ) { }
}
