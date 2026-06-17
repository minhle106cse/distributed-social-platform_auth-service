import type { ICommandHandler } from '@/common/cqrs';
import { AssignPermissionsCommand } from './assign-permissions.command';
import { RoleNotFoundError } from '@/common/errors/rbac.error';
import { RoleRepository } from '../../../domain/repositories/role.repository';
import { PermissionRepository } from '../../../domain/repositories/permission.repository';

export class AssignPermissionsHandler implements ICommandHandler<AssignPermissionsCommand> {
  constructor(
    private readonly roleRepo: RoleRepository,
    private readonly permissionRepo: PermissionRepository,
  ) {}

  async execute(command: AssignPermissionsCommand) {
    const role = await this.roleRepo.findRoleByCode(command.roleCode);
    if (!role) {
      throw new RoleNotFoundError();
    }

    const permissions = await this.permissionRepo.findPermissionsByCodes(command.permissionCodes);
    for (const permission of permissions) {
      permission.ensureIsActive();
    }

    role.assignPermissions(permissions.map(p => p.code));

    await this.roleRepo.updateRole(role);

    return { id: role.id, code: role.code, permissions: role.getPermissions };
  }
}
