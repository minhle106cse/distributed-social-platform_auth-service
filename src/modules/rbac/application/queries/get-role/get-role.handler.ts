import type { IQueryHandler } from '@distributed-social-platform/shared-kernel'
import type { GetRoleQuery } from './get-role.query'
import type { IRoleQueryRepository } from '@/modules/rbac/application/repositories/role.query-repository'
import { RoleNotFoundError } from '@/modules/rbac/domain/rbac.error'

export class GetRoleHandler implements IQueryHandler<GetRoleQuery> {
  constructor(private readonly roleQueryRepository: IRoleQueryRepository) {}

  async execute(query: GetRoleQuery) {
    const role = await this.roleQueryRepository.getRoleByCode(query.code)

    if (!role) {
      throw new RoleNotFoundError()
    }

    return role
  }
}
