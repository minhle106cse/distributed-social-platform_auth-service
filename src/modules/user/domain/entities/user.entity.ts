import { v7 } from 'uuid'
import type { UserProfile } from './user-profile.entity'
import { type AuthProvider } from '@/modules/auth/domain/enums/auth-provider.enum'
import { AuthIdentity } from '@/modules/auth/domain/value-objects/auth-identity.vo'
import type { IPasswordService } from '@/modules/auth/domain/services/password.service'
import { AuthMethodNotFoundError } from '@/common/errors/auth.error'
import { UserCannotLoginError } from '@/common/errors/user.error'

export interface UserProps {
  id: string
  email: string
  isActive: boolean
  emailVerified: boolean
  // True only when created by ProvisionUserHandler — see schema.prisma's
  // GrpcIdempotencyRecord doc for why this exists (review of ADR-0001, 2026-07-30).
  provisionedViaSaga: boolean
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
  private _provisionedViaSaga: boolean
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
    this._provisionedViaSaga = props.provisionedViaSaga
    this._authIdentities = [...props.authIdentities]
    this._profile = props.profile
    this._roles = [...props.roles]
    this._permissions = [...props.permissions]
    this._deletedAt = props.deletedAt ? new Date(props.deletedAt.getTime()) : null
  }

  static rehydrate(
    props: Omit<
      UserProps,
      'profile' | 'roles' | 'permissions' | 'deletedAt' | 'provisionedViaSaga'
    > & {
      profile?: UserProfile | null
      roles?: string[]
      permissions?: string[]
      deletedAt?: Date | null
      provisionedViaSaga?: boolean
    },
  ): User {
    return new User({
      ...props,
      profile: props.profile || null,
      roles: props.roles || [],
      permissions: props.permissions || [],
      deletedAt: props.deletedAt || null,
      provisionedViaSaga: props.provisionedViaSaga ?? false,
    })
  }

  static async create(
    props: {
      email: string
      password: string
      provisionedViaSaga?: boolean
    },
    passwordService: IPasswordService,
  ): Promise<User> {
    const passwordHash = await passwordService.hash(props.password)
    const authIdentity = AuthIdentity.create(passwordHash)

    return new User({
      id: v7(),
      email: props.email,
      isActive: true,
      emailVerified: false,
      provisionedViaSaga: props.provisionedViaSaga ?? false,
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
  get provisionedViaSaga(): boolean {
    return this._provisionedViaSaga
  }

  // Clone the array CONTAINER (shallow), not the elements: stops callers from
  // mutating the collection via the getter (e.g. `user.authIdentities.push(...)`
  // to add/remove an identity). Elements are immutable VOs, so sharing their
  // references is safe — only the array wrapper needs copying.
  get authIdentities(): AuthIdentity[] {
    return [...this._authIdentities]
  }

  // A child entity is returned by identity (no clone) — callers act on the
  // same instance, which is how `assignProfile` / `profile.update()` compose.
  get profile(): UserProfile | null {
    return this._profile
  }

  get roles(): string[] {
    return [...this._roles]
  }

  get permissions(): string[] {
    return [...this._permissions]
  }

  get deletedAt(): Date | null {
    return this._deletedAt ? new Date(this._deletedAt.getTime()) : null
  }

  isDeleted(): boolean {
    return this._deletedAt !== null
  }

  restore(): void {
    this._deletedAt = null
  }

  assignProfile(profile: UserProfile) {
    this._profile = profile
  }

  assignRoles(roles: string[]) {
    // Clone-in so a later mutation of the caller's array can't reach into state
    // (same defensive-copy discipline as the constructor and getters).
    this._roles = [...roles]
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
