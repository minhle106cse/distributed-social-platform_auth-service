import type { LoginCommand } from './login.command'
import { InvalidCredentialsError } from '@/common/errors/auth.error'
import type { RefreshTokenRepository } from '@/modules/auth/domain/repositories/refresh-token.repository'
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository'
import type { PasswordService } from '@/modules/auth/domain/services/password.service'
import type { TokenService } from '@/modules/auth/domain/services/token.service'
import { AuthProvider } from '@/modules/auth/domain/enums/auth-provider.enum'
import { RefreshToken } from '@/modules/auth/domain/entities/refresh-token.entity'

export class LoginHandler {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: LoginCommand) {
    const { email, password, ipAddress, userAgent } = command

    // Fetch user, including soft-deleted ones (so they can be told they are deleted, or recover)
    const user = await this.userRepo.findByEmail(email, true)

    if (!user) {
      throw new InvalidCredentialsError()
    }

    user.ensureCanLogin()

    const authIdentity = user.getAuthIdentity(AuthProvider.LOCAL)
    await authIdentity.localAuthenticate(password, this.passwordService)

    // Khôi phục tài khoản nếu đang ở trạng thái Soft Delete (trong vòng 30 ngày)
    if (user.isDeleted()) {
      user.restore()
      await this.userRepo.save(user)
    }

    const { refreshToken, refreshTokenEntity } = RefreshToken.createForLogin(
      {
        userId: user.id,
        email,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
      this.tokenService,
    )

    await this.refreshTokenRepo.create(refreshTokenEntity)

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
        token: refreshToken,
        expiredAt: refreshTokenEntity.expiredAt,
      },
    }
  }
}
