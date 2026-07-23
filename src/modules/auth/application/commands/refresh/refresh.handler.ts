import type { ICommandHandler, ILogger } from '@distributed-social-platform/shared-kernel'
import { logAudit, hashEmail } from '@distributed-social-platform/shared-kernel'
import type { RefreshCommand } from './refresh.command'
import { RefreshTokenNotFoundError, RefreshTokenUsedError } from '@/common/errors/auth.error'
import { UserNotFoundError } from '@/common/errors/user.error'
import type { RefreshTokenRepository } from '@/modules/auth/domain/repositories/refresh-token.repository'
import type { TokenService } from '@/modules/auth/domain/services/token.service'
import { RefreshToken } from '@/modules/auth/domain/entities/refresh-token.entity'
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository'

export class RefreshHandler implements ICommandHandler<RefreshCommand> {
  constructor(
    public readonly refreshTokenRepository: RefreshTokenRepository,
    public readonly tokenService: TokenService,
    public readonly userRepository: UserRepository,
    private readonly logger: ILogger,
  ) {}

  async execute(command: RefreshCommand) {
    const { refreshToken, ipAddress, userAgent } = command
    // sub/email are read from the SAME jwt.verify() call as tokenHash — there
    // is no unverified jwt.decode() anywhere in this flow anymore (fixes a
    // fragile decode-then-verify-later pattern that used to be split across
    // the route and this handler).
    const { tokenHash, sub, email } = this.tokenService.verifyRefreshToken(refreshToken)
    const refreshTokenEntity = await this.refreshTokenRepository.findByTokenHash(tokenHash)

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
    const claimed = await this.refreshTokenRepository.claimForUse(refreshTokenEntity.id)
    if (!claimed) {
      await this.refreshTokenRepository.revokeAllByUserId(sub)
      // The single most important audit event in this handler: a used
      // refresh token being replayed is the textbook signal of a STOLEN
      // token (attacker replaying a token the legitimate user already
      // rotated past), not routine user behavior — this is exactly the kind
      // of event worth being able to filter for (context: AuditLog).
      logAudit(this.logger, {
        action: 'auth.refresh_reuse_detected',
        outcome: 'failure',
        actorUserId: sub,
        actorEmailHash: email ? hashEmail(email) : undefined,
        ip: ipAddress,
        metadata: { allSessionsRevoked: true },
      })
      throw new RefreshTokenUsedError()
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

    await this.refreshTokenRepository.create(newRefreshTokenEntity)

    // Fetch user to get latest roles. A refresh token is only ever minted
    // (RefreshToken.create) with the email used at login, so `email` being
    // null here would mean the token payload itself is malformed — treat the
    // same as "user not found" rather than passing null into the repository.
    const user = email ? await this.userRepository.findByEmail(email) : null
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
}
