import type { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel'

export class RevokePermissionsCommand implements ICommand {
  public readonly name = RevokePermissionsCommand.name
  // updateRole = 1 nested write (Prisma tự bọc atomic) → không cần explicit tx. Admin op, contention thấp → không retry.
  public readonly options: CommandOptions = { transactional: false, retryable: false }
  constructor(
    public readonly roleCode: string,
    public readonly permissionCodes: string[],
  ) {}
}
