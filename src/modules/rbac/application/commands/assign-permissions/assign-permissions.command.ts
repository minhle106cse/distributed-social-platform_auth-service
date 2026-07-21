import type { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel'

export class AssignPermissionsCommand implements ICommand {
  readonly name = AssignPermissionsCommand.name
  readonly options: CommandOptions = {
    transactional: false,
    // set-semantics: overwrites the role's permission set (nested write) — re-applying is a no-op.
  }

  constructor(
    public readonly roleCode: string,
    public readonly permissionCodes: string[],
  ) {}
}
