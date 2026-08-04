import type { Role } from '../../domain/entities/role.entity'
import { RoleMapper } from '../mapper/role.mapper'
import type { IRoleRepository } from '../../domain/repositories/role.repository'
import { Prisma } from '@/generated'

export class PrismaRoleRepository implements IRoleRepository {
  constructor(private readonly db: Prisma.TransactionClient) {}

  async findRoleByCode(code: string): Promise<Role | null> {
    const record = await this.db.role.findUnique({ where: { code } })

    if (!record) return null

    return RoleMapper.toDomain(record)
  }

  async findRolesByCodes(codes: string[]): Promise<Role[]> {
    const records = await this.db.role.findMany({ where: { code: { in: codes } } })

    return records.map((r) => RoleMapper.toDomain(r))
  }

  async getAllRoles(): Promise<Role[]> {
    const records = await this.db.role.findMany()
    return records.map((r) => RoleMapper.toDomain(r))
  }

  async createRole(role: Role): Promise<void> {
    const data = RoleMapper.toPersistence(role)
    await this.db.role.create({ data })
  }

  async updateRole(role: Role): Promise<void> {
    const data = RoleMapper.toPersistence(role)

    await this.db.role.update({ where: { id: role.id }, data })
  }

  async deleteRole(id: string): Promise<void> {
    await this.db.userRole.deleteMany({ where: { roleId: id } })
    await this.db.role.delete({ where: { id } })
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    await this.db.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      create: { userId, roleId },
      update: {}, // Do nothing if exists
    })
  }

  async revokeRoleFromUser(userId: string, roleId: string): Promise<void> {
    try {
      await this.db.userRole.delete({
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
