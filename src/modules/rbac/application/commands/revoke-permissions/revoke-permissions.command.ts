import type { ICommand } from '@distributed-social-platform/shared-kernel'

// set-semantics: overwrites the role's permission set (nested write) — re-applying is a no-op.
export class RevokePermissionsCommand implements ICommand {
  public readonly name = RevokePermissionsCommand.name
  // updateRole = 1 nested write (Prisma tự bọc atomic) → không cần explicit tx. Admin op, contention thấp → không retry.
  constructor(
    public readonly roleCode: string,
    public readonly permissionCodes: string[],
  ) {}
}
