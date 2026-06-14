import { RefreshToken } from './refresh-token.entity'
import type { TokenService } from '@/modules/auth/domain/services/token.service'
import { RefreshTokenExpiredError, RefreshTokenRevokedError } from '@/common/errors/auth.error'

describe('RefreshToken Entity', () => {
  let mockTokenService: jest.Mocked<TokenService>

  beforeEach(() => {
    mockTokenService = {
      signRefreshToken: jest.fn(),
    } as any
  })

  it('should rehydrate from properties', () => {
    const props = {
      id: 'token-1',
      userId: 'user-1',
      tokenHash: 'hash-1',
      expiredAt: new Date(),
      usedAt: new Date(),
      revokedAt: null,
      ipAddress: '127.0.0.1',
      userAgent: 'Jest',
    }

    const token = RefreshToken.rehydrate(props)

    expect(token.id).toBe(props.id)
    expect(token.userId).toBe(props.userId)
    expect(token.tokenHash).toBe(props.tokenHash)
    expect(token.expiredAt).toBe(props.expiredAt)
    expect(token.usedAt).toBe(props.usedAt)
    expect(token.revokedAt).toBeUndefined()
    expect(token.ipAddress).toBe(props.ipAddress)
    expect(token.userAgent).toBe(props.userAgent)
  })

  it('should create for login with correct defaults', () => {
    const futureDate = new Date(Date.now() + 100000)
    mockTokenService.signRefreshToken.mockReturnValue({
      token: 'jwt-token',
      tokenHash: 'hashed-jwt',
      expiredAt: futureDate,
    })

    const result = RefreshToken.createForLogin(
      { userId: 'user-1', email: 'test@example.com', ipAddress: '127.0.0.1', userAgent: 'Jest' },
      mockTokenService
    )

    expect(result.refreshToken).toBe('jwt-token')
    
    const entity = result.refreshTokenEntity
    expect(entity.userId).toBe('user-1')
    expect(entity.tokenHash).toBe('hashed-jwt')
    expect(entity.expiredAt).toBe(futureDate)
    expect(entity.usedAt).toBeUndefined()
    expect(entity.revokedAt).toBeUndefined()
    expect(entity.ipAddress).toBe('127.0.0.1')
    expect(entity.userAgent).toBe('Jest')
  })

  it('should throw RefreshTokenRevokedError if revoked and asserted', () => {
    const token = RefreshToken.rehydrate({
      id: '1', userId: '1', tokenHash: 'hash', expiredAt: new Date(Date.now() + 100000),
      usedAt: null, revokedAt: new Date(), ipAddress: null, userAgent: null
    })

    expect(() => token.assertUsable()).toThrow(RefreshTokenRevokedError)
  })

  it('should throw RefreshTokenExpiredError if expired and asserted', () => {
    const token = RefreshToken.rehydrate({
      id: '1', userId: '1', tokenHash: 'hash', expiredAt: new Date(Date.now() - 100000), // past
      usedAt: null, revokedAt: null, ipAddress: null, userAgent: null
    })

    expect(() => token.assertUsable()).toThrow(RefreshTokenExpiredError)
  })

  it('should pass assertUsable if valid', () => {
    const token = RefreshToken.rehydrate({
      id: '1', userId: '1', tokenHash: 'hash', expiredAt: new Date(Date.now() + 100000), // future
      usedAt: null, revokedAt: null, ipAddress: null, userAgent: null
    })

    expect(() => token.assertUsable()).not.toThrow()
  })

  it('should mark as used', () => {
    const token = RefreshToken.rehydrate({
      id: '1', userId: '1', tokenHash: 'hash', expiredAt: new Date(Date.now() + 100000), // future
      usedAt: null, revokedAt: null, ipAddress: null, userAgent: null
    })

    expect(token.usedAt).toBeUndefined()
    token.markAsUsed()
    expect(token.usedAt).toBeDefined()
  })

  it('should revoke token', () => {
    const token = RefreshToken.rehydrate({
      id: '1', userId: '1', tokenHash: 'hash', expiredAt: new Date(Date.now() + 100000), // future
      usedAt: null, revokedAt: null, ipAddress: null, userAgent: null
    })

    expect(token.revokedAt).toBeUndefined()
    token.revoke()
    expect(token.revokedAt).toBeDefined()
  })
})
