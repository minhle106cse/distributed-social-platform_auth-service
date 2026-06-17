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
  usedAt: Date | null
  revokedAt: Date | null
  ipAddress: string | null
  userAgent: string | null
}

export class RefreshToken {
  private _id: string;
  private _userId: string;
  private _tokenHash: string;
  private _expiredAt: Date;
  private _usedAt: Date | null;
  private _revokedAt: Date | null;
  private _ipAddress: string | null;
  private _userAgent: string | null;

  private constructor(props: RefreshTokenProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._tokenHash = props.tokenHash;
    this._expiredAt = new Date(props.expiredAt.getTime());
    this._usedAt = props.usedAt ? new Date(props.usedAt.getTime()) : null;
    this._revokedAt = props.revokedAt ? new Date(props.revokedAt.getTime()) : null;
    this._ipAddress = props.ipAddress;
    this._userAgent = props.userAgent;
  }

  get id(): string { return this._id }
  get userId(): string { return this._userId }
  get tokenHash(): string { return this._tokenHash }
  get expiredAt(): Date { return this._expiredAt }
  get ipAddress(): string | null { return this._ipAddress }
  get userAgent(): string | null { return this._userAgent }

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
      usedAt: props.usedAt,
      revokedAt: props.revokedAt,
      ipAddress: props.ipAddress,
      userAgent: props.userAgent,
    })
  }

  static createForLogin(
    props: {
      userId: string
      email: string | null
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
      email: props.email,
    })

    const entity = new RefreshToken({
      id: v7(),
      userId: props.userId,
      tokenHash: signed.tokenHash,
      expiredAt: signed.expiredAt,
      usedAt: null,
      revokedAt: null,
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
