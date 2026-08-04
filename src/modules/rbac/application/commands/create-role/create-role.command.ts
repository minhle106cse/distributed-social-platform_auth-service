import type { ICommand } from '@distributed-social-platform/shared-kernel'

// Safety notes (kept from the removed CommandOptions block — ADR-0001 replaced the
// flag with the handler type, but the reasoning about replay/concurrency still applies):
// unique-constraint: role code is unique → a concurrent/replay create is rejected.
// none idempotency: a replay surfaces the unique violation as an error (admin op, acceptable).
export class CreateRoleCommand implements ICommand {
  readonly name = CreateRoleCommand.name

  constructor(
    public readonly code: string,
    public readonly nameRole: string, // named nameRole to avoid shadowing
    public readonly description?: string,
  ) {}
}
