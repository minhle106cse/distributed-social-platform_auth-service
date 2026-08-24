import type { ILogger } from '@distributed-social-platform/shared-kernel'
import { logAudit, hashEmail } from '@distributed-social-platform/shared-kernel'
import type { LoginCommand } from './login.command'
import type { AuthServiceRepos } from '@/container/repos'
import { AuthMethodNotFoundError, InvalidCredentialsError } from '@/modules/auth/domain/auth.error'
import type { IPasswordService } from '@/modules/auth/domain/services/password.service'
import type { ITokenService } from '@/modules/auth/domain/services/token.service'
import { AuthProvider } from '@/modules/auth/domain/enums/auth-provider.enum'
import { RefreshToken } from '@/modules/auth/domain/entities/refresh-token.entity'

export class LoginHandler {
  readonly kind = 'transactional' as const

  constructor(
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService,
    private readonly logger: ILogger,
  ) {}

  async execute(command: LoginCommand, tx: AuthServiceRepos) {
    const { email, password, ipAddress, userAgent } = command

    // Fetch user, including soft-deleted ones (so they can be told they are deleted, or recover)
    const user = await tx.users.findByEmail(email, true)

    if (!user) {
      // No userId to attribute this to — email is the only signal we have,
      // and it's exactly what's needed to spot credential stuffing against
      // one specific account (repeated failures, same email, many IPs).
      logAudit(this.logger, {
        action: 'auth.login',
        outcome: 'failure',
        actorUserId: null,
        actorEmailHash: hashEmail(email),
        ip: ipAddress,
        metadata: { reason: 'user_not_found' },
      })
      throw new InvalidCredentialsError()
    }

    user.ensureCanLogin()

    // A user that exists but signed up via OAuth (no LOCAL identity) must get
    // the exact same error as a wrong password — AuthMethodNotFoundError
    // leaking straight to the client tells an attacker "this email is
    // registered, just not with a password", a user-enumeration oracle.
    let authIdentity
    try {
      authIdentity = user.getAuthIdentity(AuthProvider.LOCAL)
    } catch (err) {
      if (err instanceof AuthMethodNotFoundError) {
        logAudit(this.logger, {
          action: 'auth.login',
          outcome: 'failure',
          actorUserId: user.id,
          actorEmailHash: hashEmail(email),
          ip: ipAddress,
          metadata: { reason: 'no_local_auth_method' },
        })
        throw new InvalidCredentialsError()
      }
      throw err
    }
    try {
      await authIdentity.localAuthenticate(password, this.passwordService)
    } catch (err) {
      logAudit(this.logger, {
        action: 'auth.login',
        outcome: 'failure',
        actorUserId: user.id,
        actorEmailHash: hashEmail(email),
        ip: ipAddress,
        metadata: { reason: 'wrong_password' },
      })
      throw err
    }

    // Khôi phục tài khoản nếu đang ở trạng thái Soft Delete (trong vòng 30 ngày)
    if (user.isDeleted()) {
      user.restore()
      await tx.users.save(user)
    }

    const { refreshToken, refreshTokenEntity } = RefreshToken.create(
      {
        userId: user.id,
        email,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
      this.tokenService,
    )

    await tx.refreshTokens.create(refreshTokenEntity)

    const accessToken = this.tokenService.signAccessToken({
      sub: user.id,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
    })

    return {
      userId: user.id,
      accessToken: {
        token: accessToken.token,
        expiredAt: accessToken.expiredAt,
      },
      refreshToken: {
        token: refreshToken,
        expiredAt: refreshTokenEntity.expiredAt,
      },
    }
  }

  // Runs only after the transaction has actually committed (see
  // ITransactionalCommandHandler.afterCommit's doc) — logAudit ships straight to
  // the pino stream / Elasticsearch, which does NOT roll back with the DB. Calling
  // it inside execute() used to mean a commit-time failure (P2034 detected at
  // COMMIT, after the callback already resolved) made CommandBus.withRetry re-run
  // the whole handler and log a second "success", or in the exhausted-retries
  // case leave a "success" audit entry for a login that never actually committed
  // (review of ADR-0001, 2026-07-30). The failure-path logAudit calls above stay
  // inside execute(): they all throw BEFORE any DB write, so nothing after them
  // can trigger a retry of that same attempt.
  afterCommit(command: LoginCommand, result: { userId: string }): void {
    logAudit(this.logger, {
      action: 'auth.login',
      outcome: 'success',
      actorUserId: result.userId,
      actorEmailHash: hashEmail(command.email),
      ip: command.ipAddress,
    })
  }
}
