import { PrismaRefreshTokenRepository } from '@/modules/auth/infrastructure/repositories/commands/prisma-refresh-token.repository'
import { PrismaUserRepository } from '@/modules/auth/infrastructure/repositories/commands/prisma-user.repository'
import { ImpPasswordService } from '@/modules/auth/infrastructure/services/imp-password.service'
import { ImpTokenService } from '@/modules/auth/infrastructure/services/imp-token.service'
import { prisma } from '@/infrastructure/database/prisma/prisma.client'
import { createLogger, ILogger } from '@distributed-social-platform/shared-kernel'

export function buildInfra() {
  return {
    userRepository: new PrismaUserRepository(prisma),
    refreshTokenRepository: new PrismaRefreshTokenRepository(prisma),
    passwordService: new ImpPasswordService(),
    tokenService: new ImpTokenService(),
    logger: createLogger('auth-service-commands') as ILogger,
    prisma,
  }
}

export type InfraDeps = ReturnType<typeof buildInfra>
