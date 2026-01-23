import { type Prisma, type RefreshToken as PrismaRefreshToken } from '../../../../generated'
import { RefreshToken } from '../../domain/entities/refresh-token.entity'

export class RefreshTokenMapper {
  static toDomain(record: PrismaRefreshToken): RefreshToken {
    return RefreshToken.rehydrate(record)
  }

  static toCreatePersistence(entity: RefreshToken): Prisma.RefreshTokenCreateInput {
    return {
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt,
      usedAt: entity.usedAt,
      revokedAt: entity.revokedAt,
      ipAddress: entity.ipAddress,
      userAgent: entity.userAgent,
      user: {
        connect: { id: entity.userId },
      },
    }
  }
}
