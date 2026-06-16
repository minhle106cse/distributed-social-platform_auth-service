import type { ICommandHandler } from '@/common/cqrs';
import { AssignPermissionsCommand } from './assign-permissions.command';
import { RoleRepository } from '../../../domain/repositories/role.repository';

export class AssignPermissionsHandler implements ICommandHandler<AssignPermissionsCommand> {
  constructor(
    private readonly roleRepo: RoleRepository,
  ) {}

  async execute(command: AssignPermissionsCommand) {
    const role = await this.roleRepo.findRoleByCode(command.roleCode);
    if (!role) {
      throw new Error(`Role with code ${command.roleCode} not found`);
    }

    role.assignPermissions(command.permissionCodes);

    await this.roleRepo.updateRole(role);

    return { id: role.id, code: role.code, permissions: role.getPermissions };
  }
}
