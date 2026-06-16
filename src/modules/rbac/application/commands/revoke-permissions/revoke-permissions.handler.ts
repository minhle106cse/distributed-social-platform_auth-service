import type { RevokePermissionsCommand } from './revoke-permissions.command'
import type { ICommandHandler } from '@/common/cqrs'
import type { RoleRepository } from '@/modules/rbac/domain/repositories/role.repository'
import { RoleNotFoundError } from '@/common/errors/rbac.error'

export class RevokePermissionsHandler implements ICommandHandler<RevokePermissionsCommand> {
  constructor(
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(command: RevokePermissionsCommand) {
    const role = await this.roleRepository.findRoleByCode(command.roleCode)
    if (!role) {
      throw new RoleNotFoundError()
    }

    role.revokePermissions(command.permissionCodes)
    await this.roleRepository.updateRole(role)
  }
}
