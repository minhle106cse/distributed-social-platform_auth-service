import type { DeleteRoleCommand } from './delete-role.command'
import type { ICommandHandler } from '@/common/cqrs'
import type { RoleRepository } from '@/modules/rbac/domain/repositories/role.repository'
import { RoleNotFoundError } from '@/common/errors/rbac.error'

export class DeleteRoleHandler implements ICommandHandler<DeleteRoleCommand> {
  constructor(
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(command: DeleteRoleCommand) {
    const role = await this.roleRepository.findRoleByCode(command.roleCode)
    if (!role) {
      throw new RoleNotFoundError()
    }

    await this.roleRepository.deleteRole(role.id)
  }
}
