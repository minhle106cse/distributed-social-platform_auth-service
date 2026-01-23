import { AuthProvider } from '../enums/auth-provider.enum'
import { type PasswordService } from '../services/password.service'

export class AuthMethod {
  private constructor(
    public readonly provider: AuthProvider,
    public readonly passwordHash: string,
    public readonly providerId: string | null,
  ) {}

  static rehydrate(props: {
    provider: AuthProvider
    passwordHash: string
    providerId: string | null
  }): AuthMethod {
    return new AuthMethod(
      props.provider,
      props.passwordHash,
      props.providerId,
    )
  }

  async localAuthenticate(plainPassword: string, passwordService: PasswordService): Promise<void> {
    if (this.provider !== AuthProvider.LOCAL) {
      throw new Error('Invalid auth provider')
    }

    const valid = await passwordService.verify(plainPassword, this.passwordHash)

    if (!valid) {
      throw new Error('Invalid credentials')
    }
  }
}
