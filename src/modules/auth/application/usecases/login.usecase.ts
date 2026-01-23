import { type UserRepository } from '../../domain/repositories/user.repository'
import { type RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository'
import { type LoginCommand } from '../commands/login.command'
import { AuthProvider } from '../../domain/enums/auth-provider.enum'
import { RefreshToken } from '../../domain/entities/refresh-token.entity'
import { type PasswordService } from '../../domain/services/password.service'
import { type TokenService } from '../../domain/services/token.service'

export class LoginUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(dto: LoginCommand) {
    const user = await this.userRepo.findByEmail(dto.email)

    if (!user) {
      throw new Error('Invalid credentials')
    }

    user.ensureCanLogin()

    const authMethod = user.getAuthMethod(AuthProvider.LOCAL)

    await authMethod.localAuthenticate(dto.password, this.passwordService)

    const { refreshToken, refreshTokenEntity } = RefreshToken.issue(
      {
        userId: user.id,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
      },
      this.tokenService,
    )

    await this.refreshTokenRepo.create(refreshTokenEntity)

    const accessToken = this.tokenService.signAccessToken({
      sub: user.id,
    })

    return {
      accessToken: {
        token: accessToken.token,
        expiresAt: accessToken.expiresAt,
      },
      refreshToken: {
        token: refreshToken,
        expiresAt: refreshTokenEntity.expiresAt,
      }
    }
  }
}
