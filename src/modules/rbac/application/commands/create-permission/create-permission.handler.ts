import type { ICommandHandler } from '@/common/cqrs';
import { CreatePermissionCommand } from './create-permission.command';
import { PermissionRepository } from '../../../domain/repositories/permission.repository';
import { Permission } from '../../../domain/entities/permission.entity';

export class CreatePermissionHandler implements ICommandHandler<CreatePermissionCommand> {
  constructor(
    private readonly permissionRepo: PermissionRepository,
  ) {}

  async execute(command: CreatePermissionCommand) {
    const existing = await this.permissionRepo.findPermissionByCode(command.code);
    if (existing) {
      throw new Error(`Permission with code ${command.code} already exists`);
    }

    const permission = Permission.create({
      code: command.code,
      module: command.moduleName,
      description: command.description,
    });

    await this.permissionRepo.createPermission(permission);

    return { id: permission.id, code: permission.code };
  }
}
