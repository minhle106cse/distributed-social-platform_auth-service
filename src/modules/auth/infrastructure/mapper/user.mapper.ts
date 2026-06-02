import {
  User as PrismaUser,
  AuthIdentity as PrismaAuthIdentity,
} from '@/generated'
import { User } from '@/modules/auth/domain/entities/user.entity'
import { AuthIdentity } from '@/modules/auth/domain/value-objects/auth-identity.vo'
import { AuthProvider } from '@/modules/auth/domain/enums/auth-provider.enum'

export class UserMapper {
  static toDomain(
    record: PrismaUser & { authIdentities?: PrismaAuthIdentity[] },
  ): User {
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
    })
  }

  static toPersistence(user: User) {
    return {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      authIdentities: {
        create: user.getAuthIdentities.map((m) => ({
          provider: m.provider,
          passwordHash: m.passwordHash,
          providerId: m.providerId,
        })),
      },
    }
  }
}
