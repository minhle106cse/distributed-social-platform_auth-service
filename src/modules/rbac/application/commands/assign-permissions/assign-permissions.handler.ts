import type { AuthServiceRepos } from '@/container/repos'
import { isValidSystemPermission } from '@distributed-social-platform/shared-kernel'
import type { ITransactionalCommandHandler } from '@distributed-social-platform/shared-kernel'
import type { IRoleRepository } from '../../../domain/repositories/role.repository'
import type { AssignPermissionsCommand } from './assign-permissions.command'
import { RoleNotFoundError, InvalidPermissionCodeError } from '@/common/errors/rbac.error'

export class AssignPermissionsHandler implements ITransactionalCommandHandler<
  AssignPermissionsCommand,
  any,
  AuthServiceRepos
> {
  readonly kind = 'transactional' as const

  async execute(command: AssignPermissionsCommand, tx: AuthServiceRepos) {
    const role = await tx.roles.findRoleByCode(command.roleCode)
    if (!role) {
      throw new RoleNotFoundError()
    }

    for (const code of command.permissionCodes) {
      if (!isValidSystemPermission(code)) {
        throw new InvalidPermissionCodeError(code)
      }
    }

    role.assignPermissions(command.permissionCodes)

    await tx.roles.updateRole(role)

    return { id: role.id, code: role.code, permissions: role.permissions }
  }
}
