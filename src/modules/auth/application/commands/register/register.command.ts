import type { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel'

export class RegisterCommand implements ICommand {
  readonly name = RegisterCommand.name
  readonly options: CommandOptions = {
    transactional: true,
    // domain-guard: replay throws UserAlreadyExistsError. unique-constraint: user email is unique,
    // the backstop for the check-then-create race. transactional:true → safe to auto-retry on
    // deadlock, all writes roll back cleanly.
  }
  constructor(
    public email: string,
    public password: string,
    public username: string,
  ) {}
}
