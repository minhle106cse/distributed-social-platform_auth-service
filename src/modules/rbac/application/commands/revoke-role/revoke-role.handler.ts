import type { RevokeRoleCommand } from './revoke-role.command'
import type { ICommandHandler } from '@distributed-social-platform/shared-kernel'
import type { RoleRepository } from '@/modules/rbac/domain/repositories/role.repository'
import { RoleNotFoundError } from '@/common/errors/rbac.error'

export class RevokeRoleHandler implements ICommandHandler<RevokeRoleCommand> {
  constructor(
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(command: RevokeRoleCommand) {
    const role = await this.roleRepository.findRoleByCode(command.roleCode)
    if (!role) {
      throw new RoleNotFoundError()
    }

    await this.roleRepository.revokeRoleFromUser(command.userId, role.id)
  }
}
