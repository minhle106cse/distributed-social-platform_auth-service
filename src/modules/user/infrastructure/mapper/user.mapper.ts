import { ALL_SYSTEM_PERMISSIONS } from '@distributed-social-platform/shared-kernel'
import type {
  User as PrismaUser,
  AuthIdentity as PrismaAuthIdentity,
  UserProfile as PrismaUserProfile,
  UserRole as PrismaUserRole,
  Role as PrismaRole,
} from '@/generated'
import { User } from '@/modules/user/domain/entities/user.entity'
import { UserProfile } from '@/modules/user/domain/entities/user-profile.entity'
import { AuthIdentity } from '@/modules/auth/domain/value-objects/auth-identity.vo'
import type { AuthProvider } from '@/modules/auth/domain/enums/auth-provider.enum'
import { SystemRole } from '@/common/rbac/system-rbac'

type PrismaUserWithRelations = PrismaUser & {
  authIdentities?: PrismaAuthIdentity[]
  profile?: PrismaUserProfile | null
  roles?: (PrismaUserRole & { role: PrismaRole })[]
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
      // SUPER_ADMIN never has role_permissions rows (implicit-all by design —
      // see system-rbac.ts) — without this expansion, its JWT `permissions`
      // claim would be empty and every downstream guard (auth-service's own
      // requirePermissions, core-api's SystemPermissionGuard) would reject it.
      permissions: record.roles?.some((r) => r.role.code === SystemRole.SUPER_ADMIN)
        ? [...ALL_SYSTEM_PERMISSIONS]
        : record.roles
          ? Array.from(
              new Set(
                record.roles.flatMap((r) => r.role.permissions ?? []),
              ),
            )
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
        create: user.authIdentities.map((m) => ({
          provider: m.provider,
          passwordHash: m.passwordHash,
          providerId: m.providerId,
        })),
      },
      profile: user.profile
        ? {
            create: { id: user.profile.id, ...UserMapper.toPersistenceProfileData(user.profile) },
          }
        : undefined,
    }
  }
}
