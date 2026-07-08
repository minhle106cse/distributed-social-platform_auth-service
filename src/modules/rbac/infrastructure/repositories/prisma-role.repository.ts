import { getTx } from '@distributed-social-platform/shared-kernel'
import type { Role } from '../../domain/entities/role.entity'
import { RoleMapper } from '../mapper/role.mapper'
import type { RoleRepository } from '../../domain/repositories/role.repository'
import { Prisma, type PrismaClient } from '@/generated'

export class PrismaRoleRepository implements RoleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findRoleByCode(code: string): Promise<Role | null> {
    const db = getTx<PrismaClient>() ?? this.prisma
    const record = await db.role.findUnique({ where: { code } })

    if (!record) return null

    return RoleMapper.toDomain(record)
  }

  async findRolesByCodes(codes: string[]): Promise<Role[]> {
    const db = getTx<PrismaClient>() ?? this.prisma
    const records = await db.role.findMany({ where: { code: { in: codes } } })

    return records.map((r) => RoleMapper.toDomain(r))
  }

  async getAllRoles(): Promise<Role[]> {
    const db = getTx<PrismaClient>() ?? this.prisma
    const records = await db.role.findMany()
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

    await db.role.update({ where: { id: role.id }, data })
  }

  async deleteRole(id: string): Promise<void> {
    const db = getTx<PrismaClient>() ?? this.prisma
    await db.userRole.deleteMany({ where: { roleId: id } })
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
    try {
      await db.userRole.delete({
        where: { userId_roleId: { userId, roleId } },
      })
    } catch (err) {
      // P2025 = the mapping didn't exist → revoke is idempotent, ignore. Any other
      // error (DB down, timeout) must propagate — don't report a silent success.
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025')) {
        throw err
      }
    }
  }
}
