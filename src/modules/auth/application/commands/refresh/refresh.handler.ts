import {
  RefreshTokenNotFoundError,
  RefreshTokenUsedError,
} from '@/common/errors/auth.error'
import type { RefreshTokenRepository } from '@/modules/auth/domain/repositories/refresh-token.repository'
import type { TokenService } from '@/modules/auth/domain/services/token.service'
import { RefreshToken } from '@/modules/auth/domain/entities/refresh-token.entity'
import type { RefreshCommand } from './refresh.command'
import { ICommandHandler } from '@/common/cqrs'

export class RefreshHandler implements ICommandHandler<RefreshCommand> {
  constructor(
    public readonly refreshTokenRepository: RefreshTokenRepository,
    public readonly tokenService: TokenService,
  ) {}

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

    const accessToken = this.tokenService.signAccessToken({
      sub: decoded.sub,
      email: decoded.email,
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
