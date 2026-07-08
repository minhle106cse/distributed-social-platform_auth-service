import { Role } from '../../domain/entities/role.entity'
import type { Role as PrismaRole } from '@/generated'

export class RoleMapper {
  static toDomain(record: PrismaRole): Role {
    return Role.rehydrate({
      id: record.id,
      code: record.code,
      name: record.name,
      description: record.description,
      isActive: record.isActive,
      permissions: record.permissions,
    })
  }

  static toPersistence(role: Role) {
    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      permissions: role.permissions,
    }
  }
}
