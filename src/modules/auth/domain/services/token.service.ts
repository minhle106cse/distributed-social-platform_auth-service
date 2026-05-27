export interface TokenService {
  signAccessToken(payload: object): {
    token: string
    expiredAt: Date
  }

  signRefreshToken(payload: object): {
    token: string
    tokenHash: string
    expiredAt: Date
  }

  verifyRefreshToken(token: string): string
}
