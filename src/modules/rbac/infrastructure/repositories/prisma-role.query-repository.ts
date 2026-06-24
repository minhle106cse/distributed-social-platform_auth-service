import type { PrismaClient } from '@/generated'
import type {
  RoleQueryRepository,
  RoleDto,
} from '@/modules/rbac/application/repositories/role.query-repository'

export class PrismaRoleQueryRepository implements RoleQueryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getRoles(): Promise<RoleDto[]> {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return roles.map((role) => ({
      code: role.code,
      nameRole: role.name,
      description: role.description,
      createdAt: role.createdAt,
      permissions: role.permissions.map((rp) => rp.permission.code),
    }))
  }

  async getRoleByCode(code: string): Promise<RoleDto | null> {
    const role = await this.prisma.role.findUnique({
      where: { code },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    })

    if (!role) return null

    return {
      code: role.code,
      nameRole: role.name,
      description: role.description,
      createdAt: role.createdAt,
      permissions: role.permissions.map((rp) => rp.permission.code),
    }
  }
}
