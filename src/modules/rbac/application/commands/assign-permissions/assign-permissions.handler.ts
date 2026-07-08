import { isValidSystemPermission } from '@distributed-social-platform/shared-kernel'
import type { ICommandHandler } from '@distributed-social-platform/shared-kernel'
import type { RoleRepository } from '../../../domain/repositories/role.repository'
import type { AssignPermissionsCommand } from './assign-permissions.command'
import { RoleNotFoundError, InvalidPermissionCodeError } from '@/common/errors/rbac.error'

export class AssignPermissionsHandler implements ICommandHandler<AssignPermissionsCommand> {
  constructor(private readonly roleRepo: RoleRepository) {}

  async execute(command: AssignPermissionsCommand) {
    const role = await this.roleRepo.findRoleByCode(command.roleCode)
    if (!role) {
      throw new RoleNotFoundError()
    }

    for (const code of command.permissionCodes) {
      if (!isValidSystemPermission(code)) {
        throw new InvalidPermissionCodeError(code)
      }
    }

    role.assignPermissions(command.permissionCodes)

    await this.roleRepo.updateRole(role)

    return { id: role.id, code: role.code, permissions: role.permissions }
  }
}
