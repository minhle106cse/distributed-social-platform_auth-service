import type { IQueryHandler } from '@distributed-social-platform/shared-kernel'
import type { GetPermissionsQuery } from './get-permissions.query'
import type { PermissionQueryRepository } from '@/modules/rbac/application/repositories/permission.query-repository'

export class GetPermissionsHandler implements IQueryHandler<GetPermissionsQuery> {
  constructor(private readonly permissionQueryRepository: PermissionQueryRepository) {}

  async execute(_query: GetPermissionsQuery) {
    return this.permissionQueryRepository.getPermissions()
  }
}
