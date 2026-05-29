import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { config } from '@/config'
import { type TokenService } from '@/modules/auth/domain/services/token.service'

const ACCESS_TOKEN_TTL = '15m'
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000 // 15 minutes

const REFRESH_TOKEN_TTL = '30d'
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export class ImpTokenService implements TokenService {
  signAccessToken(payload: object) {
    const token = jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: ACCESS_TOKEN_TTL,
    })

    return {
      token,
      expiredAt: new Date(Date.now() + ACCESS_TOKEN_TTL_MS),
    }
  }

  signRefreshToken(payload: object) {
    const token = jwt.sign(payload, config.jwt.refreshSecret, {
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
    jwt.verify(token, config.jwt.refreshSecret)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    return tokenHash
  }
}
