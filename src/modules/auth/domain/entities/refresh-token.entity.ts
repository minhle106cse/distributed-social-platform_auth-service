import { randomUUID } from 'crypto'
import { type TokenService } from '../services/token.service'

export class RefreshToken {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tokenHash: string,
    public readonly expiresAt: Date,
    public readonly usedAt: Date | null,
    public readonly revokedAt: Date | null,
    public readonly ipAddress: string | null,
    public readonly userAgent: string | null,
  ) {}

static rehydrate(props: {
    id: string
    userId: string
    tokenHash: string
    expiresAt: Date
    usedAt: Date | null
    revokedAt: Date | null
    ipAddress: string | null
    userAgent: string | null
  }): RefreshToken {
    return new RefreshToken(
      props.id,
      props.userId,
      props.tokenHash,
      props.expiresAt,
      props.usedAt,
      props.revokedAt,
      props.ipAddress,
      props.userAgent,
    )
  }

 static issue(
    props: {
      userId: string
      ipAddress: string | null
      userAgent: string | null
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
      randomUUID(),
      props.userId,
      signed.tokenHash,
      signed.expiresAt,
      null,
      null,
      props.ipAddress,
      props.userAgent,
    )

    return {
      refreshToken: signed.token,
      refreshTokenEntity: entity,
    }
  }
}
