import type { PrismaClient } from '@/generated'
import type {
  PermissionQueryRepository,
  PermissionDto,
} from '@/modules/rbac/application/repositories/permission.query-repository'

export class PrismaPermissionQueryRepository implements PermissionQueryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getPermissions(): Promise<PermissionDto[]> {
    const permissions = await this.prisma.permission.findMany({
      orderBy: { module: 'asc' },
    })

    return permissions.map((p) => ({
      code: p.code,
      moduleName: p.module,
      description: p.description,
      createdAt: p.createdAt,
    }))
  }
}
