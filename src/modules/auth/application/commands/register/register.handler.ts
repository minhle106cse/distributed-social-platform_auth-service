import type { ICommandHandler, ILogger } from '@distributed-social-platform/shared-kernel'
import { logAudit, hashEmail } from '@distributed-social-platform/shared-kernel'
import type { RegisterCommand } from './register.command'
import { UserAlreadyExistsError } from '@/common/errors/user.error'
import { User } from '@/modules/user/domain/entities/user.entity'
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository'
import type { PasswordService } from '@/modules/auth/domain/services/password.service'

export class RegisterHandler implements ICommandHandler<RegisterCommand> {
  constructor(
    public readonly userRepository: UserRepository,
    public readonly passwordService: PasswordService,
    private readonly logger: ILogger,
  ) {}

  async execute(command: RegisterCommand) {
    const { email, password } = command

    const existingUser = await this.userRepository.findByEmail(email)

    if (existingUser) {
      // Not audited as a "failure" — a duplicate-email registration attempt is
      // low-signal (public form, no auth yet to correlate an attacker
      // identity) compared to login/refresh failures, which target a known
      // actor. Revisit if this ever needs correlating against a registration
      // spam pattern.
      throw new UserAlreadyExistsError()
    }

    // username is not saved here, it will be published via Kafka in a later phase.
    const user = await User.create({ email, password }, this.passwordService)
    await this.userRepository.create(user)

    logAudit(this.logger, {
      action: 'auth.register',
      outcome: 'success',
      actorUserId: user.id,
      actorEmailHash: hashEmail(email),
    })
  }
}
