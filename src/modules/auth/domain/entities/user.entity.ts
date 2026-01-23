import { type AuthProvider } from "../enums/auth-provider.enum"
import { type AuthMethod } from "../value-objects/auth-method.vo"

export class User {
  private constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly isActive: boolean,
    public readonly emailVerified: boolean,
    private authMethods: AuthMethod[]
  ) {}

  static rehydrate(props: {
    id: string
    email: string
    isActive: boolean
    emailVerified: boolean
    authMethods: AuthMethod[]
  }): User { 
    return new User(
      props.id,
      props.email,
      props.isActive,
      props.emailVerified,
      props.authMethods,
    )
  }

  ensureCanLogin() {
    if (!this.isActive) {
      throw new Error('User is inactive')
    }
  }

  getAuthMethod(provider: AuthProvider): AuthMethod {
    const method = this.authMethods.find(
      m => m.provider === provider,
    )

    if (!method) {
      throw new Error('Invalid credentials')
    }

    return method
  }
}
