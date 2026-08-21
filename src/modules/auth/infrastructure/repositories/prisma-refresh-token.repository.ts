import type { Prisma } from '@/generated'
import { type RefreshToken } from '@/modules/auth/domain/entities/refresh-token.entity'
import { type IRefreshTokenRepository } from '@/modules/auth/domain/repositories/refresh-token.repository'
import { RefreshTokenMapper } from '@/modules/auth/infrastructure/mapper/refresh-token.mapper'

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly db: Prisma.TransactionClient) {}

  async findByTokenHash(tokenHash: string) {
    const record = await this.db.refreshToken.findUnique({
      where: {
        tokenHash,
      },
    })

    if (!record) return null

    return RefreshTokenMapper.toDomain(record)
  }

  async create(refreshToken: RefreshToken) {
    const data = RefreshTokenMapper.toCreatePersistence(refreshToken)
    await this.db.refreshToken.create({ data })
  }

  async update(refreshToken: RefreshToken) {
    const data = RefreshTokenMapper.toUpdatePersistence(refreshToken)
    await this.db.refreshToken.update({
      where: { id: refreshToken.id },
      data,
    })
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.db.refreshToken.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    })
  }

  async claimForUse(id: string): Promise<boolean> {
    // `usedAt: null` in the WHERE clause makes this a single atomic
    // conditional update — Postgres row lock resolves the race, not
    // application code. If another concurrent call already claimed it, this
    // WHERE matches 0 rows and `count` comes back 0.
    const result = await this.db.refreshToken.updateMany({
      where: { id, usedAt: null },
      data: { usedAt: new Date() },
    })
    return result.count === 1
  }
}
