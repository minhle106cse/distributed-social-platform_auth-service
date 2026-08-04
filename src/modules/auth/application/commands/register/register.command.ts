import type { ICommand } from '@distributed-social-platform/shared-kernel'

// Safety notes (kept from the removed CommandOptions block — ADR-0001 replaced the
// flag with the handler type, but the reasoning about replay/concurrency still applies):
// domain-guard: replay throws UserAlreadyExistsError. unique-constraint: user email is unique,
// the backstop for the check-then-create race. transactional:true → safe to auto-retry on
// deadlock, all writes roll back cleanly.
export class RegisterCommand implements ICommand {
  readonly name = RegisterCommand.name
  constructor(
    public email: string,
    public password: string,
    public username: string,
  ) {}
}
