import type { ICommand } from '@distributed-social-platform/shared-kernel'

// Safety notes (kept from the removed CommandOptions block — ADR-0001 replaced the
// flag with the handler type, but the reasoning about replay/concurrency still applies):
// natural-key + unique-constraint: user-role link keyed by (userId, roleId) — repeat is a no-op,
// concurrent duplicate rejected.
export class AssignRoleCommand implements ICommand {
  readonly name = AssignRoleCommand.name

  constructor(
    public readonly userId: string,
    public readonly roleCode: string,
  ) {}
}
