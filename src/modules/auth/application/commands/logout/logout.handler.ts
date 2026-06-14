import type { LogoutCommand } from './logout.command'
import type { ICommandHandler } from '@/common/cqrs'
import type { RefreshTokenRepository } from '@/modules/auth/domain/repositories/refresh-token.repository'
import type { TokenService } from '@/modules/auth/domain/services/token.service'

export class LogoutHandler implements ICommandHandler<LogoutCommand> {
  constructor(
    public readonly refreshTokenRepository: RefreshTokenRepository,
    public readonly tokenService: TokenService,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    const { userId, refreshToken } = command

    if (refreshToken) {
      try {
        const tokenHash = this.tokenService.verifyRefreshToken(refreshToken)
        const tokenEntity = await this.refreshTokenRepository.findByTokenHash(tokenHash)
        
        // Revoke the specific token
        if (tokenEntity && tokenEntity.userId === userId) {
          tokenEntity.revoke()
          await this.refreshTokenRepository.update(tokenEntity)
        }
      } catch (error) {
        // If the token is invalid, we simply ignore it since they are logging out anyway
      }
    }
  }
}
