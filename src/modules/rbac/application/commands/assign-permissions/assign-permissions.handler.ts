import { isValidSystemPermission } from '@distributed-social-platform/shared-kernel'
import type { ITransactionalCommandHandler } from '@distributed-social-platform/shared-kernel'
import type { AssignPermissionsCommand } from './assign-permissions.command'
import type { AuthServiceRepos } from '@/container/repos'
import { RoleNotFoundError, InvalidPermissionCodeError } from '@/modules/rbac/domain/rbac.error'

export class AssignPermissionsHandler implements ITransactionalCommandHandler<
  AssignPermissionsCommand,
  { id: string; code: string; permissions: string[] },
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
