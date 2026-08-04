import type { AuthServiceRepos } from '@/container/repos'
import type { ITransactionalCommandHandler } from '@distributed-social-platform/shared-kernel'
import type { IRoleRepository } from '../../../domain/repositories/role.repository'
import type { CreateRoleCommand } from './create-role.command'
import { Role } from '@/modules/rbac/domain/entities/role.entity'
import { RoleAlreadyExistsError } from '@/common/errors/rbac.error'

export class CreateRoleHandler implements ITransactionalCommandHandler<
  CreateRoleCommand,
  any,
  AuthServiceRepos
> {
  readonly kind = 'transactional' as const

  async execute(command: CreateRoleCommand, tx: AuthServiceRepos) {
    const existing = await tx.roles.findRoleByCode(command.code)
    if (existing) {
      throw new RoleAlreadyExistsError()
    }

    const role = Role.create({
      code: command.code,
      name: command.nameRole,
      description: command.description,
    })

    await tx.roles.createRole(role)

    return { id: role.id, code: role.code }
  }
}
