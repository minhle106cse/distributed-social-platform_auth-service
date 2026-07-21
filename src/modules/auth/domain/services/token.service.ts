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

  // Verifies the signature AND returns the decoded payload from the SAME
  // verified call — callers must never obtain sub/email via a separate
  // unverified jwt.decode() (that path is unforgeable-in-practice today only
  // because it happens to read the same token string that gets verified
  // right after; splitting decode and verify across route+handler is a
  // fragile pattern for future refactors to accidentally break).
  verifyRefreshToken(token: string): { tokenHash: string; sub: string; email: string | null }
}
