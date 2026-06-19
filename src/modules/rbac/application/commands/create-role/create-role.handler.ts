import type { ICommandHandler } from '@distributed-social-platform/shared-kernel';
import { CreateRoleCommand } from './create-role.command';
import { RoleRepository } from '../../../domain/repositories/role.repository';
import { Role } from '@/modules/rbac/domain/entities/role.entity';
import { RoleAlreadyExistsError } from '@/common/errors/rbac.error';

export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand> {
  constructor(
    private readonly roleRepo: RoleRepository,
  ) {}

  async execute(command: CreateRoleCommand) {
    const existing = await this.roleRepo.findRoleByCode(command.code);
    if (existing) {
      throw new RoleAlreadyExistsError();
    }

    const role = Role.create({
      code: command.code,
      name: command.nameRole,
      description: command.description,
    });

    await this.roleRepo.createRole(role);

    return { id: role.id, code: role.code };
  }
}
