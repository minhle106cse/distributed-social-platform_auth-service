import { v7 } from 'uuid'
import { type AuthProvider } from '@/modules/auth/domain/enums/auth-provider.enum'
import { AuthIdentity } from '@/modules/auth/domain/value-objects/auth-identity.vo'
import type { PasswordService } from '@/modules/auth/domain/services/password.service'
import { AuthMethodNotFoundError } from '@/common/errors/auth.error'
import { UserCannotLoginError } from '@/common/errors/user.error'
import { UserProfile } from './user-profile.entity'

export interface UserProps {
  id: string;
  email: string;
  isActive: boolean;
  emailVerified: boolean;
  authIdentities: AuthIdentity[];
  profile: UserProfile | null;
  roles: string[]; // System roles
  permissions: string[]; // Aggregated permissions
}

export class User {
  private _id: string;
  private _email: string;
  private _isActive: boolean;
  private _emailVerified: boolean;
  private _authIdentities: AuthIdentity[];
  private _profile: UserProfile | null;
  private _roles: string[];
  private _permissions: string[];

  private constructor(props: UserProps) {
    this._id = props.id;
    this._email = props.email;
    this._isActive = props.isActive;
    this._emailVerified = props.emailVerified;
    this._authIdentities = [...props.authIdentities];
    this._profile = props.profile;
    this._roles = [...props.roles];
    this._permissions = [...props.permissions];
  }

  static rehydrate(props: Omit<UserProps, 'profile' | 'roles' | 'permissions'> & { profile?: UserProfile | null, roles?: string[], permissions?: string[] }): User {
    return new User({
      ...props,
      profile: props.profile || null,
      roles: props.roles || [],
      permissions: props.permissions || [],
    });
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
    });
  }

  get id(): string { return this._id; }
  get email(): string { return this._email; }
  get isActive(): boolean { return this._isActive; }
  get emailVerified(): boolean { return this._emailVerified; }

  get getAuthIdentities(): AuthIdentity[] {
    return this._authIdentities;
  }

  get getProfile(): UserProfile | null {
    return this._profile;
  }

  get getRoles(): string[] {
    return this._roles;
  }

  get getPermissions(): string[] {
    return this._permissions;
  }

  assignProfile(profile: UserProfile) {
    this._profile = profile;
  }

  assignRoles(roles: string[]) {
    this._roles = roles;
  }

  revokeRole(role: string) {
    this._roles = this._roles.filter(r => r !== role);
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
