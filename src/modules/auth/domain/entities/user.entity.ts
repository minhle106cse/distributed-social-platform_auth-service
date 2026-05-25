import { AuthMethodNotFoundError } from 'apps/auth-service/src/errors/auth.error'
import { v7 } from 'uuid'
import { type AuthProvider } from '../enums/auth-provider.enum'
import { AuthMethod } from '../value-objects/auth-method.vo'
import type { PasswordService } from '../services/password.service'
import { Profile } from '../value-objects/profile.vo'

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
    return new User(props.id, props.email, props.isActive, props.emailVerified, props.authMethods)
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

  ensureCanLogin() {
    if (!this.isActive) {
      throw new Error('User is inactive')
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
