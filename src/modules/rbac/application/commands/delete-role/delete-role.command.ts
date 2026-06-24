import type { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel'

export class DeleteRoleCommand implements ICommand {
  public readonly name = DeleteRoleCommand.name
  // deleteRole = 3 lệnh riêng (userRole + rolePermission + role) → cần transaction. Admin op contention thấp → không retry.
  public readonly options: CommandOptions = { transactional: true, retryable: false }
  constructor(public readonly roleCode: string) {}
}
