import type { AuthServiceRepos } from '@/container/repos'
import type { ITransactionalCommandHandler } from '@distributed-social-platform/shared-kernel'
import type { RevokePermissionsCommand } from './revoke-permissions.command'
import type { IRoleRepository } from '@/modules/rbac/domain/repositories/role.repository'
import { RoleNotFoundError } from '@/common/errors/rbac.error'

export class RevokePermissionsHandler implements ITransactionalCommandHandler<
  RevokePermissionsCommand,
  void,
  AuthServiceRepos
> {
  readonly kind = 'transactional' as const

  async execute(command: RevokePermissionsCommand, tx: AuthServiceRepos) {
    const role = await tx.roles.findRoleByCode(command.roleCode)
    if (!role) {
      throw new RoleNotFoundError()
    }

    role.revokePermissions(command.permissionCodes)
    await tx.roles.updateRole(role)
  }
}
