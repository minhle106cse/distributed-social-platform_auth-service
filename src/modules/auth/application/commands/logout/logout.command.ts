import type { ICommand } from '@distributed-social-platform/shared-kernel'

// Safety notes (kept from the removed CommandOptions block — ADR-0001 replaced the
// flag with the handler type, but the reasoning about replay/concurrency still applies):
// set-semantics: revokes the specific token (revokedAt); re-applying lands on the same state.
export class LogoutCommand implements ICommand {
  public readonly name = LogoutCommand.name
  constructor(
    public readonly userId: string,
    public readonly refreshToken?: string,
  ) {}
}
