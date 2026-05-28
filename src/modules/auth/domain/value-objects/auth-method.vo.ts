import {
  InvalidAuthProviderError,
  InvalidCredentialsError,
} from '@/errors/auth.error'
import { AuthProvider } from '@/modules/auth/domain/enums/auth-provider.enum'
import { type PasswordService } from '@/modules/auth/domain/services/password.service'

export class AuthMethod {
  private constructor(
    public readonly provider: AuthProvider,
    public readonly passwordHash?: string,
    public readonly providerId?: string,
  ) {}

  static rehydrate(props: {
    provider: AuthProvider
    passwordHash: string | null
    providerId: string | null
  }): AuthMethod {
    return new AuthMethod(
      props.provider,
      props.passwordHash ?? undefined,
      props.providerId ?? undefined,
    )
  }

  static createForRegister(passwordHash: string): AuthMethod {
    return new AuthMethod(AuthProvider.LOCAL, passwordHash)
  }

  async localAuthenticate(plainPassword: string, passwordService: PasswordService): Promise<void> {
    if (this.provider !== AuthProvider.LOCAL || !this.passwordHash) {
      throw new InvalidAuthProviderError()
    }

    const valid = await passwordService.verify(plainPassword, this.passwordHash)

    if (!valid) {
      throw new InvalidCredentialsError()
    }
  }
}
