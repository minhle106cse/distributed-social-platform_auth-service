import { InvalidAuthProviderError, InvalidCredentialsError } from '@/common/errors/auth.error'
import { AuthProvider } from '@/modules/auth/domain/enums/auth-provider.enum'
import { type IPasswordService } from '@/modules/auth/domain/services/password.service'

export class AuthIdentity {
  private constructor(
    public readonly provider: AuthProvider,
    public readonly passwordHash?: string,
    public readonly providerId?: string,
  ) {}

  static rehydrate(props: {
    provider: AuthProvider
    passwordHash: string | null
    providerId: string | null
  }): AuthIdentity {
    return new AuthIdentity(
      props.provider,
      props.passwordHash ?? undefined,
      props.providerId ?? undefined,
    )
  }

  static create(passwordHash: string): AuthIdentity {
    return new AuthIdentity(AuthProvider.LOCAL, passwordHash)
  }

  async localAuthenticate(plainPassword: string, passwordService: IPasswordService): Promise<void> {
    if (this.provider !== AuthProvider.LOCAL || !this.passwordHash) {
      throw new InvalidAuthProviderError()
    }

    const valid = await passwordService.verify(plainPassword, this.passwordHash)

    if (!valid) {
      throw new InvalidCredentialsError()
    }
  }
}
