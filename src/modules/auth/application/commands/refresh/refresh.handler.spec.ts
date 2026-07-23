import type { ILogger } from '@distributed-social-platform/shared-kernel'
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
      claimForUse: jest.fn(),
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

    const mockAuditLogger = { info: jest.fn(), warn: jest.fn() } as unknown as jest.Mocked<ILogger>

    handler = new RefreshHandler(
      mockRefreshTokenRepository,
      mockTokenService,
      {
        findById: jest.fn().mockResolvedValue(mockUser),
        findByEmail: jest.fn().mockResolvedValue(mockUser),
      } as any,
      mockAuditLogger,
    )
  })

  it('should throw RefreshTokenNotFoundError if token not in DB', async () => {
    const command = new RefreshCommand('token', 'ip', 'ua')
    mockTokenService.verifyRefreshToken.mockReturnValue({ tokenHash: 'hash', sub: 'u1', email: 'e@e.com' })
    mockRefreshTokenRepository.findByTokenHash.mockResolvedValueOnce(null)

    await expect(handler.execute(command)).rejects.toThrow(RefreshTokenNotFoundError)
  })

  it('should throw error if token is expired', async () => {
    const command = new RefreshCommand('token', 'ip', 'ua')
    mockTokenService.verifyRefreshToken.mockReturnValue({ tokenHash: 'hash', sub: 'u1', email: 'e@e.com' })

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

  it('should revoke all tokens and throw RefreshTokenUsedError if the atomic claim loses (already used, incl. concurrent reuse)', async () => {
    const command = new RefreshCommand('token', 'ip', 'ua')
    mockTokenService.verifyRefreshToken.mockReturnValue({ tokenHash: 'hash', sub: 'u1', email: 'e@e.com' })

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

    mockRefreshTokenRepository.findByTokenHash.mockResolvedValueOnce(tokenEntity)
    // claimForUse is the single source of truth for reuse-detection now — the
    // in-memory `usedAt` on tokenEntity is irrelevant to this path (see
    // refresh.handler.ts comment on the race it closes).
    mockRefreshTokenRepository.claimForUse.mockResolvedValueOnce(false)

    await expect(handler.execute(command)).rejects.toThrow(RefreshTokenUsedError)
    expect(mockRefreshTokenRepository.claimForUse).toHaveBeenCalledWith('token-2')
    expect(mockRefreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith('u1')
  })

  it('should generate new tokens and mark old as used on success', async () => {
    const command = new RefreshCommand('token', 'ip', 'ua')
    mockTokenService.verifyRefreshToken.mockReturnValue({ tokenHash: 'hash', sub: 'u1', email: 'e@e.com' })

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
    mockRefreshTokenRepository.claimForUse.mockResolvedValueOnce(true)

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

    // Old token claimed atomically via the repository, not markAsUsed()+update()
    expect(mockRefreshTokenRepository.claimForUse).toHaveBeenCalledWith('token-3')

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
    const command = new RefreshCommand('token', 'ip', 'ua')
    mockTokenService.verifyRefreshToken.mockReturnValue({ tokenHash: 'hash', sub: 'u1', email: 'e@e.com' })

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
    mockRefreshTokenRepository.claimForUse.mockResolvedValueOnce(true)

    mockTokenService.signRefreshToken.mockReturnValue({
      token: 'new-token',
      tokenHash: 'new-hash',
      expiredAt: new Date(),
    })

    const mockUserRepo = handler.userRepository as any
    mockUserRepo.findByEmail.mockResolvedValueOnce(null)

    await expect(handler.execute(command)).rejects.toThrow(UserNotFoundError)
  })

  it('should throw UserNotFoundError without querying the repository if the verified token payload has no email', async () => {
    const command = new RefreshCommand('token', 'ip', 'ua')
    mockTokenService.verifyRefreshToken.mockReturnValue({ tokenHash: 'hash', sub: 'u1', email: null })

    const tokenEntity = RefreshToken.rehydrate({
      id: 'token-5',
      userId: 'u1',
      tokenHash: 'hash',
      expiredAt: new Date(Date.now() + 10000),
      usedAt: null,
      revokedAt: null,
      ipAddress: null,
      userAgent: null,
    })

    mockRefreshTokenRepository.findByTokenHash.mockResolvedValueOnce(tokenEntity)
    mockRefreshTokenRepository.claimForUse.mockResolvedValueOnce(true)
    mockTokenService.signRefreshToken.mockReturnValue({
      token: 'new-token',
      tokenHash: 'new-hash',
      expiredAt: new Date(),
    })

    const mockUserRepo = handler.userRepository as any

    await expect(handler.execute(command)).rejects.toThrow(UserNotFoundError)
    expect(mockUserRepo.findByEmail).not.toHaveBeenCalled()
  })
})
