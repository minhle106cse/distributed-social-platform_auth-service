import { Role } from '../../domain/entities/role.entity'
import type {
  Role as PrismaRole,
  Permission as PrismaPermission,
  RolePermission as PrismaRolePermission,
} from '@/generated'

export class RoleMapper {
  static toDomain(
    record: PrismaRole & {
      permissions?: (PrismaRolePermission & { permission: PrismaPermission })[]
    },
  ): Role {
    return Role.rehydrate({
      id: record.id,
      code: record.code,
      name: record.name,
      description: record.description,
      isActive: record.isActive,
      permissions: record.permissions ? record.permissions.map((p) => p.permission.code) : [],
    })
  }

  static toPersistence(role: Role) {
    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
    }
  }
}
