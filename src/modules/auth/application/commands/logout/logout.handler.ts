import type { LogoutCommand } from './logout.command'
import type { ICommandHandler } from '@/common/cqrs'
import type { RefreshTokenRepository } from '@/modules/auth/domain/repositories/refresh-token.repository'
import type { TokenService } from '@/modules/auth/domain/services/token.service'

import { RefreshTokenNotFoundError, ForbiddenError } from '@/common/errors/auth.error'

export class LogoutHandler implements ICommandHandler<LogoutCommand> {
  constructor(
    public readonly refreshTokenRepository: RefreshTokenRepository,
    public readonly tokenService: TokenService,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    const { userId, refreshToken } = command

    if (!refreshToken) {
      return
    }

    const tokenHash = this.tokenService.verifyRefreshToken(refreshToken)
    const tokenEntity = await this.refreshTokenRepository.findByTokenHash(tokenHash)

    if (!tokenEntity) {
      throw new RefreshTokenNotFoundError()
    }

    if (tokenEntity.userId !== userId) {
      throw new ForbiddenError()
    }
    
    // Revoke the specific token
    tokenEntity.revoke()
    await this.refreshTokenRepository.update(tokenEntity)
  }
}
