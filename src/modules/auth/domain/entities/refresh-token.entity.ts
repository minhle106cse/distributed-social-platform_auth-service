import { v7 } from 'uuid'
import {
  RefreshTokenExpiredError,
  RefreshTokenRevokedError,
} from '@/common/errors/auth.error'
import { type TokenService } from '@/modules/auth/domain/services/token.service'

export class RefreshToken {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tokenHash: string,
    public readonly expiredAt: Date,
    private _usedAt?: Date,
    public readonly revokedAt?: Date,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {}

  get usedAt() {
    return this._usedAt
  }

  static rehydrate(props: {
    id: string
    userId: string
    tokenHash: string
    expiredAt: Date
    usedAt: Date | null
    revokedAt: Date | null
    ipAddress: string | null
    userAgent: string | null
  }): RefreshToken {
    return new RefreshToken(
      props.id,
      props.userId,
      props.tokenHash,
      props.expiredAt,
      props.usedAt ?? undefined,
      props.revokedAt ?? undefined,
      props.ipAddress ?? undefined,
      props.userAgent ?? undefined,
    )
  }

  static createForLogin(
    props: {
      userId: string
      email?: string
      ipAddress?: string
      userAgent?: string
    },
    tokenService: TokenService,
  ): {
    refreshToken: string
    refreshTokenEntity: RefreshToken
  } {
    const signed = tokenService.signRefreshToken({
      sub: props.userId,
      email: props.email,
    })

    const entity = new RefreshToken(
      v7(),
      props.userId,
      signed.tokenHash,
      signed.expiredAt,
      undefined,
      undefined,
      props.ipAddress,
      props.userAgent,
    )

    return {
      refreshToken: signed.token,
      refreshTokenEntity: entity,
    }
  }

  assertUsable() {
    if (this.revokedAt) {
      throw new RefreshTokenRevokedError()
    }

    if (this.expiredAt < new Date()) {
      throw new RefreshTokenExpiredError()
    }
  }

  markAsUsed() {
    this._usedAt = new Date()
  }
}
