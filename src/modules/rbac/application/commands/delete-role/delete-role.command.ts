import type { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel'

export class DeleteRoleCommand implements ICommand {
  public readonly name = DeleteRoleCommand.name
  // deleteRole = 2 lệnh riêng (userRole + role) → cần transaction. Admin op contention thấp → không retry.
  public readonly options: CommandOptions = { transactional: true, retryable: false }
  constructor(public readonly roleCode: string) {}
}
