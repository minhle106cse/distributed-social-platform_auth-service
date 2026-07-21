import type { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel'

export class AssignRoleCommand implements ICommand {
  readonly name = AssignRoleCommand.name
  readonly options: CommandOptions = {
    transactional: false,
    // natural-key + unique-constraint: user-role link keyed by (userId, roleId) — repeat is a no-op,
    // concurrent duplicate rejected.
  }

  constructor(
    public readonly userId: string,
    public readonly roleCode: string,
  ) {}
}
