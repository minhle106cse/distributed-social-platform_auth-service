import { RefreshHandler } from './refresh.handler'
import { RefreshCommand } from './refresh.command'
import type { RefreshTokenRepository } from '@/modules/auth/domain/repositories/refresh-token.repository'
import type { TokenService } from '@/modules/auth/domain/services/token.service'
import { RefreshToken } from '@/modules/auth/domain/entities/refresh-token.entity'
import {
  RefreshTokenNotFoundError,
  RefreshTokenUsedError,
  RefreshTokenExpiredError,
} from '@/common/errors/auth.error'
import { UserNotFoundError } from '@/common/errors/user.error'
import { User } from '@/modules/user/domain/entities/user.entity'

describe('RefreshHandler', () => {
  let handler: RefreshHandler
  let mockRefreshTokenRepository: jest.Mocked<RefreshTokenRepository>
  let mockTokenService: jest.Mocked<TokenService>

  beforeEach(() => {
    mockRefreshTokenRepository = {
      create: jest.fn(),
      findByTokenHash: jest.fn(),
      update: jest.fn(),
      revokeAllByUserId: jest.fn(),
    }

    mockTokenService = {
      generateAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
      signAccessToken: jest.fn(),
      signRefreshToken: jest.fn(),
    } as any

    const mockUser = User.rehydrate({
      id: 'u1',
      email: 'e@e.com',
      isActive: true,
      emailVerified: true,
      authIdentities: [],
    })

    handler = new RefreshHandler(mockRefreshTokenRepository, mockTokenService, {
      findById: jest.fn().mockResolvedValue(mockUser),
      findByEmail: jest.fn().mockResolvedValue(mockUser),
    } as any)
  })

  it('should throw RefreshTokenNotFoundError if token not in DB', async () => {
    const command = new RefreshCommand('token', { sub: 'u1', email: 'e@e.com' }, 'ip', 'ua')
    mockTokenService.verifyRefreshToken.mockReturnValue('hash')
    mockRefreshTokenRepository.findByTokenHash.mockResolvedValueOnce(null)

    await expect(handler.execute(command)).rejects.toThrow(RefreshTokenNotFoundError)
  })

  it('should throw error if token is expired', async () => {
    const command = new RefreshCommand('token', { sub: 'u1', email: 'e@e.com' }, 'ip', 'ua')
    mockTokenService.verifyRefreshToken.mockReturnValue('hash')

    const tokenEntity = RefreshToken.rehydrate({
      id: 'token-1',
      userId: 'u1',
      tokenHash: 'hash',
      expiredAt: new Date(Date.now() - 10000), // expired
      usedAt: null,
      revokedAt: null,
      ipAddress: null,
      userAgent: null,
    })
    mockRefreshTokenRepository.findByTokenHash.mockResolvedValueOnce(tokenEntity)

    await expect(handler.execute(command)).rejects.toThrow(RefreshTokenExpiredError)
  })

  it('should revoke all tokens and throw RefreshTokenUsedError if token was already used', async () => {
    const command = new RefreshCommand('token', { sub: 'u1', email: 'e@e.com' }, 'ip', 'ua')
    mockTokenService.verifyRefreshToken.mockReturnValue('hash')

    const tokenEntity = RefreshToken.rehydrate({
      id: 'token-2',
      userId: 'u1',
      tokenHash: 'hash',
      expiredAt: new Date(Date.now() + 10000),
      usedAt: null,
      revokedAt: null,
      ipAddress: null,
      userAgent: null,
    })
    tokenEntity.markAsUsed() // already used

    mockRefreshTokenRepository.findByTokenHash.mockResolvedValueOnce(tokenEntity)

    await expect(handler.execute(command)).rejects.toThrow(RefreshTokenUsedError)
    expect(mockRefreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith('u1')
  })

  it('should generate new tokens and mark old as used on success', async () => {
    const command = new RefreshCommand('token', { sub: 'u1', email: 'e@e.com' }, 'ip', 'ua')
    mockTokenService.verifyRefreshToken.mockReturnValue('hash')

    const tokenEntity = RefreshToken.rehydrate({
      id: 'token-3',
      userId: 'u1',
      tokenHash: 'hash',
      expiredAt: new Date(Date.now() + 10000),
      usedAt: null,
      revokedAt: null,
      ipAddress: null,
      userAgent: null,
    })

    mockRefreshTokenRepository.findByTokenHash.mockResolvedValueOnce(tokenEntity)

    mockTokenService.signRefreshToken.mockReturnValue({
      token: 'new-token',
      tokenHash: 'new-hash',
      expiredAt: new Date(),
    })
    mockTokenService.signAccessToken.mockReturnValue({
      token: 'access-token',
      expiredAt: new Date(),
    })

    const result = await handler.execute(command)

    // Old token should be marked as used and updated
    expect(tokenEntity.usedAt).toBeDefined()
    expect(mockRefreshTokenRepository.update).toHaveBeenCalledWith(tokenEntity)

    // New token should be created
    expect(mockRefreshTokenRepository.create).toHaveBeenCalled()
    expect(mockTokenService.signAccessToken).toHaveBeenCalledWith({
      sub: 'u1',
      email: 'e@e.com',
      roles: [],
      permissions: [],
    })

    expect(result.accessToken.token).toBe('access-token')
    expect(result.refreshToken.token).toBe('new-token')
  })

  it('should throw UserNotFoundError if user is not found in DB', async () => {
    const command = new RefreshCommand('token', { sub: 'u1', email: 'e@e.com' }, 'ip', 'ua')
    mockTokenService.verifyRefreshToken.mockReturnValue('hash')

    const tokenEntity = RefreshToken.rehydrate({
      id: 'token-4',
      userId: 'u1',
      tokenHash: 'hash',
      expiredAt: new Date(Date.now() + 10000),
      usedAt: null,
      revokedAt: null,
      ipAddress: null,
      userAgent: null,
    })

    mockRefreshTokenRepository.findByTokenHash.mockResolvedValueOnce(tokenEntity)

    mockTokenService.signRefreshToken.mockReturnValue({
      token: 'new-token',
      tokenHash: 'new-hash',
      expiredAt: new Date(),
    })

    const mockUserRepo = handler.userRepository as any
    mockUserRepo.findByEmail.mockResolvedValueOnce(null)

    await expect(handler.execute(command)).rejects.toThrow(UserNotFoundError)
  })
})
