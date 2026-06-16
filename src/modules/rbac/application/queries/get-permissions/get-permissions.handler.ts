import type { GetPermissionsQuery } from './get-permissions.query'
import type { IQueryHandler } from '@/common/cqrs'
import type { PermissionQueryRepository } from '@/modules/rbac/application/repositories/permission.query-repository'

export class GetPermissionsHandler implements IQueryHandler<GetPermissionsQuery> {
  constructor(private readonly permissionQueryRepository: PermissionQueryRepository) {}

  async execute(_query: GetPermissionsQuery) {
    return this.permissionQueryRepository.getPermissions()
  }
}
