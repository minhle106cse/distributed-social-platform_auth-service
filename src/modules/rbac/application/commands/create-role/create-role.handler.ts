import type { ICommandHandler } from '@/common/cqrs';
import { CreateRoleCommand } from './create-role.command';
import { RoleRepository } from '../../../domain/repositories/role.repository';
import { Role } from '../../../domain/entities/role.entity';

export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand> {
  constructor(
    private readonly roleRepo: RoleRepository,
  ) {}

  async execute(command: CreateRoleCommand) {
    const existing = await this.roleRepo.findRoleByCode(command.code);
    if (existing) {
      throw new Error(`Role with code ${command.code} already exists`);
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
