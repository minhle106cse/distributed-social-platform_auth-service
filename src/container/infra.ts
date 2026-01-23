import { ImplPasswordService } from "../modules/auth/infrastructure/imp-services/imp-password.service";
import { ImpTokenService } from "../modules/auth/infrastructure/imp-services/imp-token.service";
import { PrismaRefreshTokenRepository } from "../modules/auth/infrastructure/prisma/prisma-refresh-token.repository";
import { PrismaUserRepository } from "../modules/auth/infrastructure/prisma/prisma-user.repository";

export function buildInfra() {
  return {
    userRepository: new PrismaUserRepository(),
    refreshTokenRepository: new PrismaRefreshTokenRepository(),
    passwordService: new ImplPasswordService(),
    tokenService: new ImpTokenService(),
  };
}

export type InfraDeps = ReturnType<typeof buildInfra>;