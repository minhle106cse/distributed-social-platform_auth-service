import type {
  ITransactionalCommandHandler,
  ILogger,
} from '@distributed-social-platform/shared-kernel'
import { logAudit, hashEmail } from '@distributed-social-platform/shared-kernel'
import type { RefreshCommand } from './refresh.command'
import type { AuthServiceRepos } from '@/container/repos'
import { RefreshTokenNotFoundError } from '@/modules/auth/domain/auth.error'
import { UserNotFoundError } from '@/modules/user/domain/user.error'
import type { ITokenService } from '@/modules/auth/domain/services/token.service'
import { RefreshToken } from '@/modules/auth/domain/entities/refresh-token.entity'

export type RefreshResult =
  | { reused: true; userId: string; email: string | null; ipAddress?: string }
  | {
      reused?: false
      accessToken: { token: string; expiredAt: Date }
      refreshToken: { token: string; expiredAt: Date }
    }

export class RefreshHandler implements ITransactionalCommandHandler<
  RefreshCommand,
  RefreshResult,
  AuthServiceRepos
> {
  readonly kind = 'transactional' as const

  constructor(
    public readonly tokenService: ITokenService,
    private readonly logger: ILogger,
  ) {}

  async execute(command: RefreshCommand, tx: AuthServiceRepos): Promise<RefreshResult> {
    const { refreshToken, ipAddress, userAgent } = command
    // sub/email are read from the SAME jwt.verify() call as tokenHash — there
    // is no unverified jwt.decode() anywhere in this flow anymore (fixes a
    // fragile decode-then-verify-later pattern that used to be split across
    // the route and this handler).
    const { tokenHash, sub, email } = this.tokenService.verifyRefreshToken(refreshToken)
    const refreshTokenEntity = await tx.refreshTokens.findByTokenHash(tokenHash)

    if (!refreshTokenEntity) {
      throw new RefreshTokenNotFoundError()
    }

    refreshTokenEntity.assertUsable()

    // Atomic conditional claim, not read-then-write — the in-memory
    // `refreshTokenEntity.usedAt` read above is already stale the instant a
    // concurrent request commits, so checking it here would let two
    // simultaneous refreshes for the same token both pass. claimForUse()
    // pushes the check into the UPDATE's WHERE clause so Postgres resolves
    // the race, not this code.
    const claimed = await tx.refreshTokens.claimForUse(refreshTokenEntity.id)
    if (!claimed) {
      // Must NOT throw here: this handler is transactional, and throwing
      // aborts the transaction — rolling back the revocation below, which
      // defeats the entire point of it (the DB write would silently vanish
      // while an audit log claiming "allSessionsRevoked:true" survives,
      // since logAudit ships straight to pino and does not roll back with
      // the DB). Returning a result lets the revocation actually commit;
      // the caller (auth.routes.ts) turns `reused: true` into the 401 after
      // that commit has happened. Audit logging moves to afterCommit for the
      // same reason it does on the success path (see LoginHandler).
      await tx.refreshTokens.revokeAllByUserId(sub)
      return { reused: true as const, userId: sub, email, ipAddress }
    }

    const { refreshToken: newRefreshToken, refreshTokenEntity: newRefreshTokenEntity } =
      RefreshToken.create(
        {
          userId: sub,
          email,
          ipAddress: ipAddress ?? null,
          userAgent: userAgent ?? null,
        },
        this.tokenService,
      )

    await tx.refreshTokens.create(newRefreshTokenEntity)

    // Fetch user to get latest roles. A refresh token is only ever minted
    // (RefreshToken.create) with the email used at login, so `email` being
    // null here would mean the token payload itself is malformed — treat the
    // same as "user not found" rather than passing null into the repository.
    const user = email ? await tx.users.findByEmail(email) : null
    if (!user) {
      throw new UserNotFoundError()
    }

    user.ensureCanLogin()

    const accessToken = this.tokenService.signAccessToken({
      sub: user.id,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
    })

    return {
      accessToken: {
        token: accessToken.token,
        expiredAt: accessToken.expiredAt,
      },
      refreshToken: {
        token: newRefreshToken,
        expiredAt: newRefreshTokenEntity.expiredAt,
      },
    }
  }

  // Runs only after the transaction has actually committed (see
  // ITransactionalCommandHandler.afterCommit's doc / LoginHandler for the
  // same pattern). The reuse-detected audit event moved here because it
  // used to fire inside execute() BEFORE the throw that rolled back the
  // revocation it was describing — see the comment above `return { reused:
  // true, ... }`.
  afterCommit(_command: RefreshCommand, result: RefreshResult): void {
    if (result.reused) {
      // The single most important audit event in this handler: a used
      // refresh token being replayed is the textbook signal of a STOLEN
      // token (attacker replaying a token the legitimate user already
      // rotated past), not routine user behavior.
      logAudit(this.logger, {
        action: 'auth.refresh_reuse_detected',
        outcome: 'failure',
        actorUserId: result.userId,
        actorEmailHash: result.email ? hashEmail(result.email) : undefined,
        ip: result.ipAddress,
        metadata: { allSessionsRevoked: true },
      })
    }
  }
}
