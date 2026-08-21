import type { ITransactionalCommandHandler } from '@distributed-social-platform/shared-kernel'
import type { RevokeRoleCommand } from './revoke-role.command'
import type { AuthServiceRepos } from '@/container/repos'
import { RoleNotFoundError } from '@/common/errors/rbac.error'

export class RevokeRoleHandler implements ITransactionalCommandHandler<
  RevokeRoleCommand,
  void,
  AuthServiceRepos
> {
  readonly kind = 'transactional' as const

  async execute(command: RevokeRoleCommand, tx: AuthServiceRepos) {
    const role = await tx.roles.findRoleByCode(command.roleCode)
    if (!role) {
      throw new RoleNotFoundError()
    }

    await tx.roles.revokeRoleFromUser(command.userId, role.id)
  }
}
