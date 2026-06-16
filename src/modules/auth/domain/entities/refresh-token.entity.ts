import { v7 } from 'uuid'
import {
  RefreshTokenExpiredError,
  RefreshTokenRevokedError,
} from '@/common/errors/auth.error'
import { type TokenService } from '@/modules/auth/domain/services/token.service'

export interface RefreshTokenProps {
  id: string
  userId: string
  tokenHash: string
  expiredAt: Date
  usedAt?: Date
  revokedAt?: Date
  ipAddress?: string
  userAgent?: string
}

export class RefreshToken {
  private _id: string;
  private _userId: string;
  private _tokenHash: string;
  private _expiredAt: Date;
  private _usedAt?: Date;
  private _revokedAt?: Date;
  private _ipAddress?: string;
  private _userAgent?: string;

  private constructor(props: RefreshTokenProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._tokenHash = props.tokenHash;
    this._expiredAt = new Date(props.expiredAt.getTime());
    this._usedAt = props.usedAt ? new Date(props.usedAt.getTime()) : undefined;
    this._revokedAt = props.revokedAt ? new Date(props.revokedAt.getTime()) : undefined;
    this._ipAddress = props.ipAddress;
    this._userAgent = props.userAgent;
  }

  get id(): string { return this._id }
  get userId(): string { return this._userId }
  get tokenHash(): string { return this._tokenHash }
  get expiredAt(): Date { return this._expiredAt }
  get ipAddress(): string | undefined { return this._ipAddress }
  get userAgent(): string | undefined { return this._userAgent }

  get usedAt() {
    return this._usedAt
  }

  get revokedAt() {
    return this._revokedAt
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
    return new RefreshToken({
      id: props.id,
      userId: props.userId,
      tokenHash: props.tokenHash,
      expiredAt: props.expiredAt,
      usedAt: props.usedAt ?? undefined,
      revokedAt: props.revokedAt ?? undefined,
      ipAddress: props.ipAddress ?? undefined,
      userAgent: props.userAgent ?? undefined,
    })
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

    const entity = new RefreshToken({
      id: v7(),
      userId: props.userId,
      tokenHash: signed.tokenHash,
      expiredAt: signed.expiredAt,
      ipAddress: props.ipAddress,
      userAgent: props.userAgent,
    })

    return {
      refreshToken: signed.token,
      refreshTokenEntity: entity,
    }
  }

  assertUsable() {
    if (this._revokedAt) {
      throw new RefreshTokenRevokedError()
    }

    if (this._expiredAt < new Date()) {
      throw new RefreshTokenExpiredError()
    }
  }

  markAsUsed() {
    this._usedAt = new Date()
  }

  revoke() {
    this._revokedAt = new Date()
  }
}
