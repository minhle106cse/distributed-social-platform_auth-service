import { PrismaRefreshTokenRepository } from "../modules/auth/infrastructure/repositories/commands/prisma-refresh-token.repository";
import { PrismaUserRepository } from "../modules/auth/infrastructure/repositories/commands/prisma-user.repository";
import { ImpPasswordService } from "../modules/auth/infrastructure/services/imp-password.service";
import { ImpTokenService } from "../modules/auth/infrastructure/services/imp-token.service";

 
export function buildInfra() {
  return {
    userRepository: new PrismaUserRepository(),
    refreshTokenRepository: new PrismaRefreshTokenRepository(),
    passwordService: new ImpPasswordService(),
    tokenService: new ImpTokenService(),
  };
}

export type InfraDeps = ReturnType<typeof buildInfra>;