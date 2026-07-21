import type { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel'

export class CreateRoleCommand implements ICommand {
  readonly name = CreateRoleCommand.name
  readonly options: CommandOptions = {
    transactional: false,
    // unique-constraint: role code is unique → a concurrent/replay create is rejected.
    // none idempotency: a replay surfaces the unique violation as an error (admin op, acceptable).
  }

  constructor(
    public readonly code: string,
    public readonly nameRole: string, // named nameRole to avoid shadowing
    public readonly description?: string,
  ) {}
}
