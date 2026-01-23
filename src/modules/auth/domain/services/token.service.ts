export interface TokenService {
  signAccessToken(payload: object): {
    token: string;
    expiresAt: Date;
  };

  signRefreshToken(payload: object): {
    token: string;
    tokenHash: string;
    expiresAt: Date;
  };
}
