import type {
  ITransactionalCommandHandler,
  ILogger,
} from '@distributed-social-platform/shared-kernel'
import { logAudit, hashEmail } from '@distributed-social-platform/shared-kernel'
import type { RegisterCommand } from './register.command'
import type { AuthServiceRepos } from '@/container/repos'
import { UserAlreadyExistsError } from '@/common/errors/user.error'
import { User } from '@/modules/user/domain/entities/user.entity'
import type { IPasswordService } from '@/modules/auth/domain/services/password.service'

export class RegisterHandler implements ITransactionalCommandHandler<
  RegisterCommand,
  { userId: string },
  AuthServiceRepos
> {
  readonly kind = 'transactional' as const

  constructor(
    public readonly passwordService: IPasswordService,
    private readonly logger: ILogger,
  ) {}

  async execute(command: RegisterCommand, tx: AuthServiceRepos): Promise<{ userId: string }> {
    const { email, password } = command

    const existingUser = await tx.users.findByEmail(email)

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
    await tx.users.create(user)

    return { userId: user.id }
  }

  // Runs only after the transaction has committed — see LoginHandler.afterCommit's
  // doc for why this moved out of execute() (review of ADR-0001, 2026-07-30).
  afterCommit(command: RegisterCommand, result: { userId: string }): void {
    logAudit(this.logger, {
      action: 'auth.register',
      outcome: 'success',
      actorUserId: result.userId,
      actorEmailHash: hashEmail(command.email),
    })
  }
}
