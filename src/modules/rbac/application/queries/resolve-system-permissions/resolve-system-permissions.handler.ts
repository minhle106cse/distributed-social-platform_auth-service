import type { IQueryHandler } from '@distributed-social-platform/shared-kernel'
import type { ResolveSystemPermissionsQuery } from './resolve-system-permissions.query'
import type { IRoleQueryRepository } from '@/modules/rbac/application/repositories/role.query-repository'
import { resolveSystemPermissions } from '@/common/rbac/resolve-system-permissions'

export interface ResolveSystemPermissionsResult {
  permissions: string[]
}

/**
 * Applies the SAME rule the JWT is minted with — `resolveSystemPermissions()`,
 * not a second copy — so a SUPER_ADMIN cannot be implicit-all on one path and
 * empty on the other.
 */
export class ResolveSystemPermissionsHandler implements IQueryHandler<
  ResolveSystemPermissionsQuery,
  ResolveSystemPermissionsResult
> {
  constructor(private readonly roleQueryRepo: IRoleQueryRepository) {}

  async execute(query: ResolveSystemPermissionsQuery): Promise<ResolveSystemPermissionsResult> {
    const roles = await this.roleQueryRepo.findRolesByUserId(query.userId)
    return { permissions: resolveSystemPermissions(roles) }
  }
}
