import { type ILogger } from '@distributed-social-platform/shared-kernel'
import { PrismaRefreshTokenRepository } from '@/modules/auth/infrastructure/repositories/prisma-refresh-token.repository'
import { PrismaUserRepository } from '@/modules/user/infrastructure/repositories/prisma-user.repository'
import { Argon2PasswordService } from '@/modules/auth/infrastructure/services/argon2-password.service'
import { JwtTokenService } from '@/modules/auth/infrastructure/services/jwt-token.service'
import { prisma } from '@/infrastructure/database/prisma/prisma.client'

export function buildInfra(logger: ILogger) {
  return {
    userRepository: new PrismaUserRepository(prisma),
    refreshTokenRepository: new PrismaRefreshTokenRepository(prisma),
    passwordService: new Argon2PasswordService(),
    tokenService: new JwtTokenService(),
    logger,
    prisma,
  }
}

export type InfraDeps = ReturnType<typeof buildInfra>
