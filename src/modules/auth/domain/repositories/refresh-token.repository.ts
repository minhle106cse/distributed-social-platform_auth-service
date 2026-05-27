import { type RefreshToken } from '../entities/refresh-token.entity'

export interface RefreshTokenRepository {
  create(refreshToken: RefreshToken): Promise<void>
  update(refreshToken: RefreshToken): Promise<void>
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>
  revokeAllByUserId(userId: string): Promise<void>
}
