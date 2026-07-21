import type { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel'

export class DeleteRoleCommand implements ICommand {
  public readonly name = DeleteRoleCommand.name
  // deleteRole = 2 lệnh riêng (userRole + role) → cần transaction. Admin op contention thấp → không retry.
  public readonly options: CommandOptions = {
    transactional: true,
    // natural-key: delete by role code (2 deletes in one tx) — a repeat is a no-op.
  }
  constructor(public readonly roleCode: string) {}
}
