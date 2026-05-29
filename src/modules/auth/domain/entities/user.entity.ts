import { v7 } from 'uuid'
import { type AuthProvider } from '@/modules/auth/domain/enums/auth-provider.enum'
import { AuthMethod } from '@/modules/auth/domain/value-objects/auth-method.vo'
import type { PasswordService } from '@/modules/auth/domain/services/password.service'
import { Profile } from '@/modules/auth/domain/value-objects/profile.vo'
import { AuthMethodNotFoundError, UserCannotLoginError } from '@/errors/auth.error'

export class User {
  private constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly isActive: boolean,
    public readonly emailVerified: boolean,
    private authMethods: AuthMethod[],
    private profile?: Profile,
  ) {}

  static rehydrate(props: {
    id: string
    email: string
    isActive: boolean
    emailVerified: boolean
    authMethods: AuthMethod[]
    profile?: Profile
  }): User {
    return new User(props.id, props.email, props.isActive, props.emailVerified, props.authMethods, props.profile)
  }

  static async createForRegister(
    props: {
      email: string
      password: string
      fullName: string
    },
    passwordService: PasswordService,
  ): Promise<User> {
    const passwordHash = await passwordService.hash(props.password)
    const authMethod = AuthMethod.createForRegister(passwordHash)
    const profile = Profile.createForRegister({ fullName: props.fullName })

    return new User(v7(), props.email, true, false, [authMethod], profile)
  }

  get getAuthMethods(): AuthMethod[] {
    return this.authMethods
  }

  get getProfile(): Profile | undefined {
    return this.profile
  }

  ensureCanLogin() {
    if (!this.isActive) {
      throw new UserCannotLoginError()
    }
  }

  getAuthMethod(provider: AuthProvider): AuthMethod {
    const method = this.authMethods.find((m) => m.provider === provider)

    if (!method) {
      throw new AuthMethodNotFoundError()
    }

    return method
  }
}
