import type { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel'

export class RevokeRoleCommand implements ICommand {
  public readonly name = RevokeRoleCommand.name
  // 1 lệnh delete idempotent (userRole) → không cần transaction, không cần retry.
  public readonly options: CommandOptions = { transactional: false, retryable: false }
  constructor(
    public readonly userId: string,
    public readonly roleCode: string,
  ) {}
}
