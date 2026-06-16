import { InvalidCredentialsError } from '@/common/errors/auth.error'
import type { RefreshTokenRepository } from '@/modules/auth/domain/repositories/refresh-token.repository'
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository'
import type { PasswordService } from '@/modules/auth/domain/services/password.service'
import type { TokenService } from '@/modules/auth/domain/services/token.service'
import { AuthProvider } from '@/modules/auth/domain/enums/auth-provider.enum'
import { RefreshToken } from '@/modules/auth/domain/entities/refresh-token.entity'
import type { LoginCommand } from './login.command'

export class LoginHandler {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) { }

  async execute(command: LoginCommand) {
    const { email, password, ipAddress, userAgent } = command

    const user = await this.userRepo.findByEmail(email)

    if (!user) {
      throw new InvalidCredentialsError()
    }

    user.ensureCanLogin()

    const authIdentity = user.getAuthIdentity(AuthProvider.LOCAL)

    await authIdentity.localAuthenticate(password, this.passwordService)

    const { refreshToken, refreshTokenEntity } = RefreshToken.createForLogin(
      {
        userId: user.id,
        email,
        ipAddress,
        userAgent,
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
