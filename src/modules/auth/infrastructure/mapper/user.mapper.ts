import type {
  User as PrismaUser,
  AuthMethod as PrismaAuthMethod,
  Prisma,
  Profile as PrismaProfile,
} from '@/generated'
import { User } from '@/modules/auth/domain/entities/user.entity'
import { type AuthProvider } from '@/modules/auth/domain/enums/auth-provider.enum'
import { AuthMethod } from '@/modules/auth/domain/value-objects/auth-method.vo'

export class UserMapper {
  static toDomain(
    record: PrismaUser & { authMethods?: PrismaAuthMethod[] } & { profile?: PrismaProfile },
  ): User {
    return User.rehydrate({
      ...record,
      authMethods: record.authMethods
        ? record.authMethods.map((r) =>
            AuthMethod.rehydrate({
              provider: r.provider as AuthProvider,
              passwordHash: r.passwordHash,
              providerId: r.providerId,
            }),
          )
        : [],
      profile: record.profile
        ? {
            fullName: record.profile.fullName,
          }
        : undefined,
    })
  }

  static toCreatePersistence(user: User): Prisma.UserCreateInput {
    return {
      email: user.email,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      authMethods: {
        create: user.getAuthMethods.map((m) => ({
          provider: m.provider,
          passwordHash: m.passwordHash,
          providerId: m.providerId,
        })),
      },
      profile: user.getProfile
        ? {
            create: {
              fullName: user.getProfile.fullName,
            },
          }
        : undefined,
    }
  }
}
