import { type AuthMethod as PrismaAuthMethod, type User as PrismaUser } from "../../../../generated/client";
import { User } from "../../domain/entities/user.entity";
import { type AuthProvider } from "../../domain/enums/auth-provider.enum";
import { AuthMethod } from "../../domain/value-objects/auth-method.vo";

export class UserMapper {
  static toDomain(record: PrismaUser & { authMethods: PrismaAuthMethod[] }): User {
    return User.rehydrate({
      ...record,
      authMethods: record.authMethods.map(r =>
        AuthMethod.rehydrate({
          provider: r.provider as AuthProvider,
          passwordHash: r.passwordHash,
          providerId: r.providerId,
        }),
      ),
    })
  }
}