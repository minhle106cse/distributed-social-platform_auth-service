import { type RefreshToken } from '../../domain/entities/refresh-token.entity'
import { type RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository'
import { RefreshTokenMapper } from '../mapper/refresh-token.mapper'

export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  async create(refreshToken: RefreshToken) {
    const record = await prisma.refreshToken.create({
      data: RefreshTokenMapper.toCreatePersistence(refreshToken),
    })
    return RefreshTokenMapper.toDomain(record)
  }
}
