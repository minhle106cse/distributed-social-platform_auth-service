import { UserAlreadyExistsError } from '@/errors/auth.error'
import { User } from '@/modules/auth/domain/entities/user.entity'
import type { UserRepository } from '@/modules/auth/domain/repositories/user.repository'
import type { PasswordService } from '@/modules/auth/domain/services/password.service'
import type { RegisterCommand } from './register.command'

export class RegisterHandler {
  constructor(
    public readonly userRepository: UserRepository,
    public readonly passwordService: PasswordService,
  ) {}

  async execute(command: RegisterCommand) {
    const { email, password, fullName } = command

    const existingUser = await this.userRepository.findByEmail(email)

    if (existingUser) {
      throw new UserAlreadyExistsError()
    }

    const user = await User.createForRegister({ email, password, fullName }, this.passwordService)
    await this.userRepository.create(user)
  }
}
