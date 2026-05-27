import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { config } from '../../../../config'
import { type TokenService } from '../../domain/services/token.service'

export class ImpTokenService implements TokenService {
  signAccessToken(payload: object) {
    const expiresInMs = 15 * 60 * 1000

    const token = jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: '15m',
    })

    return {
      token,
      expiredAt: new Date(Date.now() + expiresInMs),
    }
  }

  signRefreshToken(payload: object) {
    const expiresInMs = 30 * 24 * 60 * 60 * 1000

    const token = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: '30d',
    })

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    return {
      token,
      tokenHash,
      expiredAt: new Date(Date.now() + expiresInMs),
    }
  }

  verifyRefreshToken(token: string) {
    jwt.verify(token, config.jwt.refreshSecret)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    return tokenHash
  }
}
