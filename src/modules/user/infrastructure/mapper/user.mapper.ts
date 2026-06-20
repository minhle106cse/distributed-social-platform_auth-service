import {
  User as PrismaUser,
  AuthIdentity as PrismaAuthIdentity,
  UserProfile as PrismaUserProfile,
  UserRole as PrismaUserRole,
  Role as PrismaRole,
  RolePermission as PrismaRolePermission,
  Permission as PrismaPermission,
} from '@/generated'
import { User } from '@/modules/user/domain/entities/user.entity'
import { UserProfile } from '@/modules/user/domain/entities/user-profile.entity'
import { AuthIdentity } from '@/modules/auth/domain/value-objects/auth-identity.vo'
import { AuthProvider } from '@/modules/auth/domain/enums/auth-provider.enum'

type PrismaRoleWithPermissions = PrismaRole & {
  permissions?: (PrismaRolePermission & { permission: PrismaPermission })[]
}

type PrismaUserWithRelations = PrismaUser & {
  authIdentities?: PrismaAuthIdentity[]
  profile?: PrismaUserProfile | null
  roles?: (PrismaUserRole & { role: PrismaRoleWithPermissions })[]
}

export class UserMapper {
  static toDomain(record: PrismaUserWithRelations): User {
    return User.rehydrate({
      id: record.id,
      email: record.email,
      isActive: record.isActive,
      emailVerified: record.emailVerified,
      authIdentities: record.authIdentities
        ? record.authIdentities.map((r) =>
            AuthIdentity.rehydrate({
              provider: r.provider as AuthProvider,
              passwordHash: r.passwordHash,
              providerId: r.providerId,
            }),
          )
        : [],
      profile: record.profile
        ? UserProfile.rehydrate({
            id: record.profile.id,
            userId: record.profile.userId,
            firstName: record.profile.firstName,
            lastName: record.profile.lastName,
            displayName: record.profile.displayName,
            avatarUrl: record.profile.avatarUrl,
            phoneNumber: record.profile.phoneNumber,
          })
        : null,
      roles: record.roles ? record.roles.map((r) => r.role.code) : [],
      permissions: record.roles
        ? Array.from(new Set(record.roles.flatMap(r => r.role.permissions?.map(p => p.permission.code) ?? [])))
        : [],
      deletedAt: record.deletedAt,
    })
  }

  static toPersistenceUserData(user: User) {
    return {
      email: user.email,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      deletedAt: user.deletedAt,
    }
  }

  static toPersistenceProfileData(profile: UserProfile) {
    return {
      firstName: profile.firstName,
      lastName: profile.lastName,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      phoneNumber: profile.phoneNumber,
    }
  }

  static toPersistence(user: User) {
    return {
      id: user.id,
      ...UserMapper.toPersistenceUserData(user),
      authIdentities: {
        create: user.getAuthIdentities.map((m) => ({
          provider: m.provider,
          passwordHash: m.passwordHash,
          providerId: m.providerId,
        })),
      },
      profile: user.getProfile
        ? {
            create: UserMapper.toPersistenceProfileData(user.getProfile),
          }
        : undefined,
    }
  }
}
