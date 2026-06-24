import type { ICommandHandler } from '@distributed-social-platform/shared-kernel'
import type { PermissionRepository } from '../../../domain/repositories/permission.repository'
import type { CreatePermissionCommand } from './create-permission.command'
import { Permission } from '@/modules/rbac/domain/entities/permission.entity'
import { PermissionAlreadyExistsError } from '@/common/errors/rbac.error'

export class CreatePermissionHandler implements ICommandHandler<CreatePermissionCommand> {
  constructor(private readonly permissionRepo: PermissionRepository) {}

  async execute(command: CreatePermissionCommand) {
    const existing = await this.permissionRepo.findPermissionByCode(command.code)
    if (existing) {
      throw new PermissionAlreadyExistsError()
    }

    const permission = Permission.create({
      code: command.code,
      module: command.moduleName,
      description: command.description,
    })

    await this.permissionRepo.createPermission(permission)

    return { id: permission.id, code: permission.code }
  }
}
