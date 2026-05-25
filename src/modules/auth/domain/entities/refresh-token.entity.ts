import { v7 } from 'uuid'
import { type TokenService } from '../services/token.service'

export class RefreshToken {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tokenHash: string,
    public readonly expiredAt: Date,
    public readonly usedAt?: Date,
    public readonly revokedAt?: Date,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {}

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
}
