import { type RefreshToken } from '@/modules/auth/domain/entities/refresh-token.entity'

export interface IRefreshTokenRepository {
  create(refreshToken: RefreshToken): Promise<void>
  update(refreshToken: RefreshToken): Promise<void>
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>
  revokeAllByUserId(userId: string): Promise<void>
  // Atomic conditional claim (`UPDATE ... WHERE id = ? AND usedAt IS NULL`) —
  // the ONLY correct way to detect refresh-token reuse under concurrency.
  // Read-then-write (find, check usedAt in memory, then update) has a race:
  // two concurrent requests for the same token both read usedAt=null before
  // either commits, so both pass the check and both get issued a new token
  // pair, defeating reuse-detection entirely. Returns true iff THIS call won
  // the claim (row was unused and is now marked used by it).
  claimForUse(id: string): Promise<boolean>
}
