import { Permission as PrismaPermission } from '@/generated'
import { Permission } from '../../domain/entities/permission.entity'

export class PermissionMapper {
  static toDomain(record: PrismaPermission): Permission {
    return Permission.rehydrate({
      id: record.id,
      code: record.code,
      module: record.module,
      description: record.description,
      isActive: record.isActive,
    })
  }

  static toPersistence(permission: Permission) {
    return {
      id: permission.id,
      code: permission.code,
      module: permission.module,
      description: permission.description,
      isActive: permission.isActive,
    }
  }
}
