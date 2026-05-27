import { PrismaRefreshTokenRepository } from "../modules/auth/infrastructure/repositories/commands/prisma-refresh-token.repository";
import { PrismaUserRepository } from "../modules/auth/infrastructure/repositories/commands/prisma-user.repository";
import { ImpPasswordService } from "../modules/auth/infrastructure/services/imp-password.service";
import { ImpTokenService } from "../modules/auth/infrastructure/services/imp-token.service";
import { prisma } from "../prisma/prisma.client";

 
export function buildInfra() {
  return {
    userRepository: new PrismaUserRepository(prisma),
    refreshTokenRepository: new PrismaRefreshTokenRepository(prisma),
    passwordService: new ImpPasswordService(),
    tokenService: new ImpTokenService(),
  };
}

export type InfraDeps = ReturnType<typeof buildInfra>;