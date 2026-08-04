import type { ICommand } from '@distributed-social-platform/shared-kernel'

// natural-key: delete of the user-role link is idempotent — a repeat is a no-op.
export class RevokeRoleCommand implements ICommand {
  public readonly name = RevokeRoleCommand.name
  // 1 lệnh delete idempotent (userRole) → không cần transaction, không cần retry.
  constructor(
    public readonly userId: string,
    public readonly roleCode: string,
  ) {}
}
