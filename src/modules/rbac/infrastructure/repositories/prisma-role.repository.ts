import { getTx } from '@distributed-social-platform/shared-kernel'
import type { Role } from '../../domain/entities/role.entity'
import { RoleMapper } from '../mapper/role.mapper'
import type { RoleRepository } from '../../domain/repositories/role.repository'
import type { PrismaClient } from '@/generated'

export class PrismaRoleRepository implements RoleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findRoleByCode(code: string): Promise<Role | null> {
    const db = getTx<PrismaClient>() ?? this.prisma
    const record = await db.role.findUnique({
      where: { code },
      include: { permissions: { include: { permission: true } } },
    })

    if (!record) return null

    return RoleMapper.toDomain(record)
  }

  async findRolesByCodes(codes: string[]): Promise<Role[]> {
    const db = getTx<PrismaClient>() ?? this.prisma
    const records = await db.role.findMany({
      where: { code: { in: codes } },
      include: { permissions: { include: { permission: true } } },
    })

    return records.map((r) => RoleMapper.toDomain(r))
  }

  async getAllRoles(): Promise<Role[]> {
    const db = getTx<PrismaClient>() ?? this.prisma
    const records = await db.role.findMany({
      include: { permissions: { include: { permission: true } } },
    })
    return records.map((r) => RoleMapper.toDomain(r))
  }

  async createRole(role: Role): Promise<void> {
    const data = RoleMapper.toPersistence(role)
    const db = getTx<PrismaClient>() ?? this.prisma
    await db.role.create({ data })
  }

  async updateRole(role: Role): Promise<void> {
    const data = RoleMapper.toPersistence(role)
    const db = getTx<PrismaClient>() ?? this.prisma

    const permissionCodes = role.getPermissions
    const permissions = await db.permission.findMany({
      where: { code: { in: permissionCodes } },
      select: { id: true },
    })

    await db.role.update({
      where: { id: role.id },
      data: {
        ...data,
        permissions: {
          deleteMany: {},
          create: permissions.map((p) => ({
            permissionId: p.id,
          })),
        },
      },
    })
  }

  async deleteRole(id: string): Promise<void> {
    const db = getTx<PrismaClient>() ?? this.prisma
    await db.userRole.deleteMany({ where: { roleId: id } })
    await db.rolePermission.deleteMany({ where: { roleId: id } })
    await db.role.delete({ where: { id } })
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    const db = getTx<PrismaClient>() ?? this.prisma
    await db.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      create: { userId, roleId },
      update: {}, // Do nothing if exists
    })
  }

  async revokeRoleFromUser(userId: string, roleId: string): Promise<void> {
    const db = getTx<PrismaClient>() ?? this.prisma
    await db.userRole
      .delete({
        where: { userId_roleId: { userId, roleId } },
      })
      .catch(() => {}) // Ignore if not exists
  }
}
