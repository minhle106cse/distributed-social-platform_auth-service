import type { ICommand } from '@distributed-social-platform/shared-kernel'

// Safety notes (kept from the removed CommandOptions block — ADR-0001 replaced the
// flag with the handler type, but the reasoning about replay/concurrency still applies):
// set-semantics: overwrites the role's permission set (nested write) — re-applying is a no-op.
export class AssignPermissionsCommand implements ICommand {
  readonly name = AssignPermissionsCommand.name

  constructor(
    public readonly roleCode: string,
    public readonly permissionCodes: string[],
  ) {}
}
