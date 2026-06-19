import { ICommand } from '@distributed-social-platform/shared-kernel'

export class LogoutCommand implements ICommand {
  public readonly name = LogoutCommand.name
  constructor(
    public readonly userId: string,
    public readonly refreshToken?: string,
  ) { }
}
