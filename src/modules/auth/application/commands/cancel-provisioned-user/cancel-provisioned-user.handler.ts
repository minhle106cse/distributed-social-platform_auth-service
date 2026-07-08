import type { ICommandHandler } from '@distributed-social-platform/shared-kernel'
import type { CancelProvisionedUserCommand } from './cancel-provisioned-user.command'
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository'

export interface CancelProvisionedUserResult {
  cancelled: boolean
}

export class CancelProvisionedUserHandler
  implements ICommandHandler<CancelProvisionedUserCommand, CancelProvisionedUserResult>
{
  constructor(public readonly userRepository: UserRepository) {}

  async execute(command: CancelProvisionedUserCommand): Promise<CancelProvisionedUserResult> {
    const user = await this.userRepository.findById(command.userId)
    if (!user) return { cancelled: false }

    // Only ever hard-delete a user we JUST provisioned and nobody has touched
    // since — emailVerified flips to true on activation, so this refuses to
    // remove an account that's already in real use.
    if (user.emailVerified) return { cancelled: false }

    await this.userRepository.hardDelete(command.userId)
    return { cancelled: true }
  }
}
