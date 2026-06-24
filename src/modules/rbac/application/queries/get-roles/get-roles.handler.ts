import type { IQueryHandler } from '@distributed-social-platform/shared-kernel'
import type { GetRolesQuery } from './get-roles.query'
import type { RoleQueryRepository } from '@/modules/rbac/application/repositories/role.query-repository'

export class GetRolesHandler implements IQueryHandler<GetRolesQuery> {
  constructor(private readonly roleQueryRepository: RoleQueryRepository) {}

  async execute(_query: GetRolesQuery) {
    return this.roleQueryRepository.getRoles()
  }
}
