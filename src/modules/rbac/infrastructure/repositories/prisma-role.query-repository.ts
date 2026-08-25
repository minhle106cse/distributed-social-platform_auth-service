import type { PrismaClient } from '@/generated'
import type { IRoleQueryRepository } from '@/modules/rbac/application/repositories/role.query-repository'
import type { RoleDto } from '@/modules/rbac/application/queries/role.dto'
import type { RoleWithPermissions } from '@/common/rbac/resolve-system-permissions'

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

  async findRolesByUserId(userId: string): Promise<RoleWithPermissions[]> {
    // Soft-deleted / deactivated users resolve to NO roles rather than to their
    // last known set: this feeds an authorization decision, so a disabled
    // account must lose its platform privileges the moment the row changes, not
    // when its token happens to expire. Same for a disabled or soft-deleted
    // ROLE — filtered in the query, not in JS, so the condition cannot silently
    // stop working if the selected columns change.
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null, isActive: true },
      select: {
        roles: {
          where: { role: { isActive: true, deletedAt: null } },
          select: { role: { select: { code: true, permissions: true } } },
        },
      },
    })
    if (!user) return []

    return user.roles.map((userRole) => ({
      code: userRole.role.code,
      permissions: userRole.role.permissions,
    }))
  }
}
