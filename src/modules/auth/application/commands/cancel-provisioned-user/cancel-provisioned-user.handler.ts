import type { AuthServiceRepos } from '@/container/repos'
import type { ITransactionalCommandHandler } from '@distributed-social-platform/shared-kernel'
import type { CancelProvisionedUserCommand } from './cancel-provisioned-user.command'
import type { IUserRepository } from '@/modules/user/domain/repositories/user.repository'

export interface CancelProvisionedUserResult {
  cancelled: boolean
}

export class CancelProvisionedUserHandler implements ITransactionalCommandHandler<
  CancelProvisionedUserCommand,
  CancelProvisionedUserResult,
  AuthServiceRepos
> {
  readonly kind = 'transactional' as const

  async execute(
    command: CancelProvisionedUserCommand,
    tx: AuthServiceRepos,
  ): Promise<CancelProvisionedUserResult> {
    const user = await tx.users.findById(command.userId)
    if (!user) return { cancelled: false }

    // Only ever hard-delete a user we JUST provisioned and nobody has touched
    // since — emailVerified flips to true on activation, so this refuses to
    // remove an account that's already in real use.
    if (user.emailVerified) return { cancelled: false }

    await tx.users.hardDelete(command.userId)
    return { cancelled: true }
  }
}
