import type { ICommandHandler } from '@distributed-social-platform/shared-kernel';
import { AssignRoleCommand } from './assign-role.command';
import { RoleNotFoundError } from '@/common/errors/rbac.error';
import { RoleRepository } from '../../../domain/repositories/role.repository';

export class AssignRoleHandler implements ICommandHandler<AssignRoleCommand> {
  constructor(
    private readonly roleRepo: RoleRepository,
  ) {}

  async execute(command: AssignRoleCommand) {
    const role = await this.roleRepo.findRoleByCode(command.roleCode);
    if (!role) {
      throw new RoleNotFoundError();
    }

    role.ensureIsActive();

    await this.roleRepo.assignRoleToUser(command.userId, role.id);

    return { success: true };
  }
}
