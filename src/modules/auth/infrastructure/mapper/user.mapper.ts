import type {
  User as PrismaUser,
  AuthMethod as PrismaAuthMethod,
  Prisma,
  Profile as PrismaProfile,
} from 'apps/auth-service/src/generated'
import { User } from '../../domain/entities/user.entity'
import { type AuthProvider } from '../../domain/enums/auth-provider.enum'
import { AuthMethod } from '../../domain/value-objects/auth-method.vo'

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
        create: user['authMethods'].map((m) => ({
          provider: m.provider,
          passwordHash: m.passwordHash,
          providerId: m.providerId,
        })),
      },
      profile: user['profile']
        ? {
            create: {
              fullName: user['profile'].fullName,
            },
          }
        : undefined,
    }
  }
}
