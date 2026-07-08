import { randomBytes } from 'crypto'
import type { ICommandHandler } from '@distributed-social-platform/shared-kernel'
import type { ProvisionUserCommand } from './provision-user.command'
import { UserAlreadyExistsError } from '@/common/errors/user.error'
import { User } from '@/modules/user/domain/entities/user.entity'
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository'
import type { PasswordService } from '@/modules/auth/domain/services/password.service'

export interface ProvisionUserResult {
  userId: string
  temporaryPassword: string
}

export class ProvisionUserHandler
  implements ICommandHandler<ProvisionUserCommand, ProvisionUserResult>
{
  constructor(
    public readonly userRepository: UserRepository,
    public readonly passwordService: PasswordService,
  ) {}

  async execute(command: ProvisionUserCommand): Promise<ProvisionUserResult> {
    const { email } = command

    const existingUser = await this.userRepository.findByEmail(email)
    if (existingUser) {
      throw new UserAlreadyExistsError()
    }

    const temporaryPassword = randomBytes(12).toString('base64url')
    const user = await User.create({ email, password: temporaryPassword }, this.passwordService)
    await this.userRepository.create(user)

    return { userId: user.id, temporaryPassword }
  }
}
