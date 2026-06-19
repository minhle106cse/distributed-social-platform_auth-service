import type { GetRoleQuery } from './get-role.query'
import type { IQueryHandler } from '@distributed-social-platform/shared-kernel'
import type { RoleQueryRepository } from '@/modules/rbac/application/repositories/role.query-repository'
import { RoleNotFoundError } from '@/common/errors/rbac.error'

export class GetRoleHandler implements IQueryHandler<GetRoleQuery> {
  constructor(private readonly roleQueryRepository: RoleQueryRepository) {}

  async execute(query: GetRoleQuery) {
    const role = await this.roleQueryRepository.getRoleByCode(query.code)
    
    if (!role) {
      throw new RoleNotFoundError()
    }

    return role
  }
}
