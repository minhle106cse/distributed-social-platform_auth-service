import { getTx } from '@distributed-social-platform/shared-kernel'
import type { Permission } from '../../domain/entities/permission.entity'
import type { PermissionRepository } from '../../domain/repositories/permission.repository'
import { PermissionMapper } from '../mapper/permission.mapper'
import type { PrismaClient } from '@/generated'

export class PrismaPermissionRepository implements PermissionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findPermissionByCode(code: string): Promise<Permission | null> {
    const db = getTx<PrismaClient>() ?? this.prisma
    const record = await db.permission.findUnique({ where: { code } })
    if (!record) return null
    return PermissionMapper.toDomain(record)
  }

  async findPermissionsByCodes(codes: string[]): Promise<Permission[]> {
    const db = getTx<PrismaClient>() ?? this.prisma
    const records = await db.permission.findMany({ where: { code: { in: codes } } })
    return records.map((r) => PermissionMapper.toDomain(r))
  }

  async getAllPermissions(): Promise<Permission[]> {
    const db = getTx<PrismaClient>() ?? this.prisma
    const records = await db.permission.findMany()
    return records.map((r) => PermissionMapper.toDomain(r))
  }

  async createPermission(permission: Permission): Promise<void> {
    const data = PermissionMapper.toPersistence(permission)
    const db = getTx<PrismaClient>() ?? this.prisma
    await db.permission.create({ data })
  }

  async updatePermission(permission: Permission): Promise<void> {
    const data = PermissionMapper.toPersistence(permission)
    const db = getTx<PrismaClient>() ?? this.prisma
    await db.permission.update({
      where: { id: permission.id },
      data,
    })
  }

  async deletePermission(id: string): Promise<void> {
    const db = getTx<PrismaClient>() ?? this.prisma
    // Cascade delete role_permissions that use this permission
    await db.rolePermission.deleteMany({ where: { permissionId: id } })
    await db.permission.delete({ where: { id } })
  }
}
