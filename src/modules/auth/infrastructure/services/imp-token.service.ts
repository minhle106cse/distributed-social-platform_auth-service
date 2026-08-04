import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { config } from '@/config'
import { type ITokenService } from '@/modules/auth/domain/services/token.service'

const ACCESS_TOKEN_TTL = '15m'
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000 // 15 minutes

const REFRESH_TOKEN_TTL = '30d'
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export class ImpTokenService implements ITokenService {
  signAccessToken(payload: object) {
    const token = jwt.sign(payload, config.jwt.privateKey, {
      algorithm: 'RS256',
      expiresIn: ACCESS_TOKEN_TTL,
    })

    return {
      token,
      expiredAt: new Date(Date.now() + ACCESS_TOKEN_TTL_MS),
    }
  }

  signRefreshToken(payload: object) {
    // Refresh token dùng HS256 (symmetric) — chỉ auth-service verify, không cần asymmetric
    const token = jwt.sign(payload, config.jwt.refreshSecret, {
      algorithm: 'HS256',
      expiresIn: REFRESH_TOKEN_TTL,
    })

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    return {
      token,
      tokenHash,
      expiredAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    }
  }

  verifyRefreshToken(token: string) {
    // jwt.verify both checks the signature AND returns the payload — the sub/
    // email below are only ever read from a token whose signature has just
    // been checked, never from an unverified jwt.decode().
    const payload = jwt.verify(token, config.jwt.refreshSecret) as jwt.JwtPayload & {
      sub: string
      email: string | null
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    return { tokenHash, sub: payload.sub, email: payload.email ?? null }
  }
}
