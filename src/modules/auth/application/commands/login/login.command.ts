import type { ICommand } from '@distributed-social-platform/shared-kernel'

// Safety notes (kept from the removed CommandOptions block — ADR-0001 replaced the
// flag with the handler type, but the reasoning about replay/concurrency still applies):
// none: each login mints a fresh session/refresh token — repeating is harmless by design (a new
// session, not a duplicated side effect), so there is nothing to dedupe. transactional:true →
// safe to auto-retry on deadlock.
export class LoginCommand implements ICommand {
  readonly name = LoginCommand.name
  constructor(
    public email: string,
    public password: string,
    public ipAddress?: string,
    public userAgent?: string,
  ) {}
}
