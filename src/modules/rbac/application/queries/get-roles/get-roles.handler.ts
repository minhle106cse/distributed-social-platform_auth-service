import type { IQueryHandler } from '@distributed-social-platform/shared-kernel'
import type { GetRolesQuery } from './get-roles.query'
import type { IRoleQueryRepository } from '@/modules/rbac/application/queries/role.query-repository'

export class GetRolesHandler implements IQueryHandler<GetRolesQuery> {
  constructor(private readonly roleQueryRepository: IRoleQueryRepository) {}

  async execute(_query: GetRolesQuery) {
    return this.roleQueryRepository.getRoles()
  }
}
