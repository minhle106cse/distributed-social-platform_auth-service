import { getTx } from '@distributed-social-platform/shared-kernel'
import type { PrismaClient } from '@/generated'
import { type RefreshToken } from '@/modules/auth/domain/entities/refresh-token.entity'
import { type RefreshTokenRepository } from '@/modules/auth/domain/repositories/refresh-token.repository'
import { RefreshTokenMapper } from '@/modules/auth/infrastructure/mapper/refresh-token.mapper'

export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByTokenHash(tokenHash: string) {
    const db = getTx<PrismaClient>() ?? this.prisma
    const record = await db.refreshToken.findUnique({
      where: {
        tokenHash,
      },
    })

    if (!record) return null

    return RefreshTokenMapper.toDomain(record)
  }

  async create(refreshToken: RefreshToken) {
    const data = RefreshTokenMapper.toCreatePersistence(refreshToken)
    const db = getTx<PrismaClient>() ?? this.prisma
    await db.refreshToken.create({ data })
  }

  async update(refreshToken: RefreshToken) {
    const data = RefreshTokenMapper.toUpdatePersistence(refreshToken)
    const db = getTx<PrismaClient>() ?? this.prisma
    await db.refreshToken.update({
      where: { id: refreshToken.id },
      data,
    })
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    const db = getTx<PrismaClient>() ?? this.prisma
    await db.refreshToken.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    })
  }
}
