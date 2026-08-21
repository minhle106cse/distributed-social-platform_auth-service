import type { PrismaClient } from '@/generated'
import type { IRoleQueryRepository } from '@/modules/rbac/application/repositories/role.query-repository'
import type { RoleDto } from '@/modules/rbac/application/queries/role.dto'

export class PrismaRoleQueryRepository implements IRoleQueryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getRoles(): Promise<RoleDto[]> {
    const roles = await this.prisma.role.findMany({

      orderBy: { createdAt: 'desc' },
    })

    return roles.map((role) => ({
      code: role.code,
      nameRole: role.name,
      description: role.description,
      createdAt: role.createdAt,
      permissions: role.permissions,
    }))
  }

  async getRoleByCode(code: string): Promise<RoleDto | null> {
    const role = await this.prisma.role.findUnique({
      where: { code },

    })

    if (!role) return null

    return {
      code: role.code,
      nameRole: role.name,
      description: role.description,
      createdAt: role.createdAt,
      permissions: role.permissions,
    }
  }
}
