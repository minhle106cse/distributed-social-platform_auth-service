import type { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel'

export class LoginCommand implements ICommand {
  readonly name = LoginCommand.name
  readonly options: CommandOptions = {
    transactional: true,
    // none: each login mints a fresh session/refresh token — repeating is harmless by design (a new
    // session, not a duplicated side effect), so there is nothing to dedupe. transactional:true →
    // safe to auto-retry on deadlock.
  }
  constructor(
    public email: string,
    public password: string,
    public ipAddress?: string,
    public userAgent?: string,
  ) {}
}
