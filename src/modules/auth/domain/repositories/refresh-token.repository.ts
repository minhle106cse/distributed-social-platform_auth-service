import { type RefreshToken } from "../entities/refresh-token.entity";

export interface RefreshTokenRepository {
  create(refreshToken: RefreshToken): Promise<RefreshToken>
}