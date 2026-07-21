import type { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel'

export class RevokeRoleCommand implements ICommand {
  public readonly name = RevokeRoleCommand.name
  // 1 lệnh delete idempotent (userRole) → không cần transaction, không cần retry.
  public readonly options: CommandOptions = {
    transactional: false,
    // natural-key: delete of the user-role link is idempotent — a repeat is a no-op.
  }
  constructor(
    public readonly userId: string,
    public readonly roleCode: string,
  ) {}
}
