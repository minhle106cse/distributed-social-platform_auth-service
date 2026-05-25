import { type Prisma, type RefreshToken as PrismaRefreshToken } from '../../../../generated'
import { RefreshToken } from '../../domain/entities/refresh-token.entity'

export class RefreshTokenMapper {
  static toDomain(record: PrismaRefreshToken): RefreshToken {
    return RefreshToken.rehydrate(record)
  }

  static toCreatePersistence(entity: RefreshToken): Prisma.RefreshTokenCreateInput {
    return {
      id: entity.id,
      tokenHash: entity.tokenHash,
      expiredAt: entity.expiredAt,
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
