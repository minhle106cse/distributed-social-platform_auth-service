import { type ILogger } from '@distributed-social-platform/shared-kernel'
import { PrismaRefreshTokenRepository } from '@/modules/auth/infrastructure/repositories/prisma-refresh-token.repository'
import { PrismaUserRepository } from '@/modules/user/infrastructure/repositories/prisma-user.repository'
import { ImpPasswordService } from '@/modules/auth/infrastructure/services/imp-password.service'
import { ImpTokenService } from '@/modules/auth/infrastructure/services/imp-token.service'
import { prisma } from '@/infrastructure/database/prisma/prisma.client'

export function buildInfra(logger: ILogger) {
  return {
    userRepository: new PrismaUserRepository(prisma),
    refreshTokenRepository: new PrismaRefreshTokenRepository(prisma),
    passwordService: new ImpPasswordService(),
    tokenService: new ImpTokenService(),
    logger,
    prisma,
  }
}

export type InfraDeps = ReturnType<typeof buildInfra>
