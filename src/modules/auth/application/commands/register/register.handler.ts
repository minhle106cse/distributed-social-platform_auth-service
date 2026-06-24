import { UserAlreadyExistsError } from '@/common/errors/user.error'
import { User } from '@/modules/user/domain/entities/user.entity'
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository'
import type { PasswordService } from '@/modules/auth/domain/services/password.service'
import type { RegisterCommand } from './register.command'
import { ICommandHandler } from '@distributed-social-platform/shared-kernel'

export class RegisterHandler implements ICommandHandler<RegisterCommand> {
  constructor(
    public readonly userRepository: UserRepository,
    public readonly passwordService: PasswordService,
  ) {}

  async execute(command: RegisterCommand) {
    const { email, password, username } = command

    const existingUser = await this.userRepository.findByEmail(email)

    if (existingUser) {
      throw new UserAlreadyExistsError()
    }

    // username is not saved here, it will be published via Kafka in a later phase.
    const user = await User.createForRegister({ email, password }, this.passwordService)
    await this.userRepository.create(user)
  }
}
