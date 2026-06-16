import type { RefreshCommand } from './refresh.command'
import {
  RefreshTokenNotFoundError,
  RefreshTokenUsedError,
} from '@/common/errors/auth.error'
import type { RefreshTokenRepository } from '@/modules/auth/domain/repositories/refresh-token.repository'
import type { TokenService } from '@/modules/auth/domain/services/token.service'
import { RefreshToken } from '@/modules/auth/domain/entities/refresh-token.entity'
import type { ICommandHandler } from '@/common/cqrs'
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository'

export class RefreshHandler implements ICommandHandler<RefreshCommand> {
  constructor(
    public readonly refreshTokenRepository: RefreshTokenRepository,
    public readonly tokenService: TokenService,
    public readonly userRepository: UserRepository,
  ) { }

  async execute(command: RefreshCommand) {
    const { refreshToken, decoded, ipAddress, userAgent } = command
    const tokenHash = this.tokenService.verifyRefreshToken(refreshToken)
    const refreshTokenEntity = await this.refreshTokenRepository.findByTokenHash(tokenHash)

    if (!refreshTokenEntity) {
      throw new RefreshTokenNotFoundError()
    }

    refreshTokenEntity.assertUsable()

    if (refreshTokenEntity.usedAt) {
      await this.refreshTokenRepository.revokeAllByUserId(decoded.sub)
      throw new RefreshTokenUsedError()
    }

    refreshTokenEntity.markAsUsed()
    await this.refreshTokenRepository.update(refreshTokenEntity)

    const { refreshToken: newRefreshToken, refreshTokenEntity: newRefreshTokenEntity } =
      RefreshToken.createForLogin(
        {
          userId: decoded.sub,
          email: decoded.email,
          ipAddress,
          userAgent,
        },
        this.tokenService,
      )

    await this.refreshTokenRepository.create(newRefreshTokenEntity)

    // Fetch user to get latest roles
    const user = await this.userRepository.findByEmail(decoded.email)
    if (!user) {
      throw new Error('User not found during refresh')
    }

    const accessToken = this.tokenService.signAccessToken({
      sub: user.id,
      email: user.email,
      roles: user.getRoles,
      permissions: user.getPermissions,
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
