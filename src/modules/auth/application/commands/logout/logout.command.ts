import type { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel'

export class LogoutCommand implements ICommand {
  public readonly name = LogoutCommand.name
  readonly options: CommandOptions = {
    transactional: false,
    // set-semantics: revokes the specific token (revokedAt); re-applying lands on the same state.
  }
  constructor(
    public readonly userId: string,
    public readonly refreshToken?: string,
  ) {}
}
