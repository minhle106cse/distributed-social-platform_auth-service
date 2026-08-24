import type { ITransactionalCommandHandler } from '@distributed-social-platform/shared-kernel'
import type { LogoutCommand } from './logout.command'
import type { AuthServiceRepos } from '@/container/repos'
import type { ITokenService } from '@/modules/auth/domain/services/token.service'
import { RefreshTokenNotFoundError, ForbiddenError } from '@/modules/auth/domain/auth.error'

export class LogoutHandler implements ITransactionalCommandHandler<
  LogoutCommand,
  void,
  AuthServiceRepos
> {
  readonly kind = 'transactional' as const

  constructor(public readonly tokenService: ITokenService) {}

  async execute(command: LogoutCommand, tx: AuthServiceRepos): Promise<void> {
    const { userId, refreshToken } = command

    if (!refreshToken) {
      return
    }

    const { tokenHash } = this.tokenService.verifyRefreshToken(refreshToken)
    const tokenEntity = await tx.refreshTokens.findByTokenHash(tokenHash)

    if (!tokenEntity) {
      throw new RefreshTokenNotFoundError()
    }

    if (tokenEntity.userId !== userId) {
      throw new ForbiddenError()
    }

    // Revoke the specific token
    tokenEntity.revoke()
    await tx.refreshTokens.update(tokenEntity)
  }
}
