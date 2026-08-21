import type { ITransactionalCommandHandler } from '@distributed-social-platform/shared-kernel'
import type { AssignRoleCommand } from './assign-role.command'
import type { AuthServiceRepos } from '@/container/repos'
import { RoleNotFoundError } from '@/common/errors/rbac.error'

export class AssignRoleHandler implements ITransactionalCommandHandler<
  AssignRoleCommand,
  { success: boolean },
  AuthServiceRepos
> {
  readonly kind = 'transactional' as const

  async execute(command: AssignRoleCommand, tx: AuthServiceRepos) {
    const role = await tx.roles.findRoleByCode(command.roleCode)
    if (!role) {
      throw new RoleNotFoundError()
    }

    role.ensureIsActive()

    await tx.roles.assignRoleToUser(command.userId, role.id)

    return { success: true }
  }
}
