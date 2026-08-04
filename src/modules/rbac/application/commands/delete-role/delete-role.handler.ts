import type { AuthServiceRepos } from '@/container/repos'
import type { ITransactionalCommandHandler } from '@distributed-social-platform/shared-kernel'
import type { DeleteRoleCommand } from './delete-role.command'
import type { IRoleRepository } from '@/modules/rbac/domain/repositories/role.repository'
import { RoleNotFoundError } from '@/common/errors/rbac.error'

export class DeleteRoleHandler implements ITransactionalCommandHandler<
  DeleteRoleCommand,
  void,
  AuthServiceRepos
> {
  readonly kind = 'transactional' as const

  async execute(command: DeleteRoleCommand, tx: AuthServiceRepos) {
    const role = await tx.roles.findRoleByCode(command.roleCode)
    if (!role) {
      throw new RoleNotFoundError()
    }

    await tx.roles.deleteRole(role.id)
  }
}
