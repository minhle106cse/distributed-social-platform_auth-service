import { v7 } from 'uuid'
import { type AuthProvider } from '@/modules/auth/domain/enums/auth-provider.enum'
import { AuthIdentity } from '@/modules/auth/domain/value-objects/auth-identity.vo'
import type { PasswordService } from '@/modules/auth/domain/services/password.service'
import { AuthMethodNotFoundError, UserCannotLoginError } from '@/common/errors/auth.error'

export class User {
  private constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly isActive: boolean,
    public readonly emailVerified: boolean,
    private authIdentities: AuthIdentity[],
  ) {}

  static rehydrate(props: {
    id: string
    email: string
    isActive: boolean
    emailVerified: boolean
    authIdentities: AuthIdentity[]
  }): User {
    return new User(props.id, props.email, props.isActive, props.emailVerified, props.authIdentities)
  }

  static async createForRegister(
    props: {
      email: string
      password: string
    },
    passwordService: PasswordService,
  ): Promise<User> {
    const passwordHash = await passwordService.hash(props.password)
    const authIdentity = AuthIdentity.createForRegister(passwordHash)

    return new User(v7(), props.email, true, false, [authIdentity])
  }

  get getAuthIdentities(): AuthIdentity[] {
    return this.authIdentities
  }

  ensureCanLogin() {
    if (!this.isActive) {
      throw new UserCannotLoginError()
    }
  }

  getAuthIdentity(provider: AuthProvider): AuthIdentity {
    const identity = this.authIdentities.find((m) => m.provider === provider)

    if (!identity) {
      throw new AuthMethodNotFoundError()
    }

    return identity
  }
}
