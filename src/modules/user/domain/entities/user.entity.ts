import { v7 } from 'uuid'
import type { UserProfile } from './user-profile.entity'
import { type AuthProvider } from '@/modules/auth/domain/enums/auth-provider.enum'
import { AuthIdentity } from '@/modules/auth/domain/value-objects/auth-identity.vo'
import type { PasswordService } from '@/modules/auth/domain/services/password.service'
import { AuthMethodNotFoundError } from '@/common/errors/auth.error'
import { UserCannotLoginError } from '@/common/errors/user.error'

export interface UserProps {
  id: string
  email: string
  isActive: boolean
  emailVerified: boolean
  authIdentities: AuthIdentity[]
  profile: UserProfile | null
  roles: string[] // System roles
  permissions: string[] // Aggregated permissions
  deletedAt: Date | null
}

export class User {
  private _id: string
  private _email: string
  private _isActive: boolean
  private _emailVerified: boolean
  private _authIdentities: AuthIdentity[]
  private _profile: UserProfile | null
  private _roles: string[]
  private _permissions: string[]
  private _deletedAt: Date | null

  private constructor(props: UserProps) {
    this._id = props.id
    this._email = props.email
    this._isActive = props.isActive
    this._emailVerified = props.emailVerified
    this._authIdentities = [...props.authIdentities]
    this._profile = props.profile
    this._roles = [...props.roles]
    this._permissions = [...props.permissions]
    this._deletedAt = props.deletedAt
  }

  static rehydrate(
    props: Omit<UserProps, 'profile' | 'roles' | 'permissions' | 'deletedAt'> & {
      profile?: UserProfile | null
      roles?: string[]
      permissions?: string[]
      deletedAt?: Date | null
    },
  ): User {
    return new User({
      ...props,
      profile: props.profile || null,
      roles: props.roles || [],
      permissions: props.permissions || [],
      deletedAt: props.deletedAt || null,
    })
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

    return new User({
      id: v7(),
      email: props.email,
      isActive: true,
      emailVerified: false,
      authIdentities: [authIdentity],
      profile: null,
      roles: [],
      permissions: [],
      deletedAt: null,
    })
  }

  get id(): string {
    return this._id
  }
  get email(): string {
    return this._email
  }
  get isActive(): boolean {
    return this._isActive
  }
  get emailVerified(): boolean {
    return this._emailVerified
  }

  get getAuthIdentities(): AuthIdentity[] {
    return this._authIdentities
  }

  get getProfile(): UserProfile | null {
    return this._profile
  }

  get getRoles(): string[] {
    return this._roles
  }

  get getPermissions(): string[] {
    return this._permissions
  }

  get deletedAt(): Date | null {
    return this._deletedAt
  }

  isDeleted(): boolean {
    return this._deletedAt !== null
  }

  restore(): void {
    if (this._deletedAt) {
      this._deletedAt = null
    }
  }

  assignProfile(profile: UserProfile) {
    this._profile = profile
  }

  assignRoles(roles: string[]) {
    this._roles = roles
  }

  revokeRole(role: string) {
    this._roles = this._roles.filter((r) => r !== role)
  }

  ensureCanLogin() {
    if (!this._isActive) {
      throw new UserCannotLoginError()
    }
  }

  getAuthIdentity(provider: AuthProvider): AuthIdentity {
    const identity = this._authIdentities.find((m) => m.provider === provider)

    if (!identity) {
      throw new AuthMethodNotFoundError()
    }

    return identity
  }
}
