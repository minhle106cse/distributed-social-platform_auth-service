import type { AuthServiceRepos } from '@/container/repos'
import type { ITransactionalCommandHandler } from '@distributed-social-platform/shared-kernel'
import type { IRoleRepository } from '../../../domain/repositories/role.repository'
import type { AssignRoleCommand } from './assign-role.command'
import { RoleNotFoundError } from '@/common/errors/rbac.error'

export class AssignRoleHandler implements ITransactionalCommandHandler<
  AssignRoleCommand,
  any,
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
