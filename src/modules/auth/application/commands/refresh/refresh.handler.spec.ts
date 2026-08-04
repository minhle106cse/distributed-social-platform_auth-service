import type { AuthServiceRepos } from '@/container/repos'
import type { ILogger } from '@distributed-social-platform/shared-kernel'
import { RefreshHandler } from './refresh.handler'
import { RefreshCommand } from './refresh.command'
import type { IRefreshTokenRepository } from '@/modules/auth/domain/repositories/refresh-token.repository'
import type { ITokenService } from '@/modules/auth/domain/services/token.service'
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
  let tx: AuthServiceRepos
  let mockUserRepository: any
  let mockRefreshTokenRepository: jest.Mocked<IRefreshTokenRepository>
  let mockTokenService: jest.Mocked<ITokenService>

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

    mockUserRepository = {
      findById: jest.fn().mockResolvedValue(mockUser),
      findByEmail: jest.fn().mockResolvedValue(mockUser),
    } as any

    handler = new RefreshHandler(mockTokenService, mockAuditLogger)
    tx = {
      refreshTokens: mockRefreshTokenRepository,
      users: mockUserRepository,
    } as unknown as AuthServiceRepos
  })

  it('should throw RefreshTokenNotFoundError if token not in DB', async () => {
    const command = new RefreshCommand('token', 'ip', 'ua')
    mockTokenService.verifyRefreshToken.mockReturnValue({
      tokenHash: 'hash',
      sub: 'u1',
      email: 'e@e.com',
    })
    mockRefreshTokenRepository.findByTokenHash.mockResolvedValueOnce(null)

    await expect(handler.execute(command, tx)).rejects.toThrow(RefreshTokenNotFoundError)
  })

  it('should throw error if token is expired', async () => {
    const command = new RefreshCommand('token', 'ip', 'ua')
    mockTokenService.verifyRefreshToken.mockReturnValue({
      tokenHash: 'hash',
      sub: 'u1',
      email: 'e@e.com',
    })

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

    await expect(handler.execute(command, tx)).rejects.toThrow(RefreshTokenExpiredError)
  })

  it('should revoke all tokens and return reused:true (not throw) if the atomic claim loses (already used, incl. concurrent reuse)', async () => {
    const command = new RefreshCommand('token', 'ip', 'ua')
    mockTokenService.verifyRefreshToken.mockReturnValue({
      tokenHash: 'hash',
      sub: 'u1',
      email: 'e@e.com',
    })

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

    // Must NOT throw: throwing here would abort the transaction and roll
    // back revokeAllByUserId, defeating the security response it performs.
    const result = await handler.execute(command, tx)

    expect(result).toEqual({ reused: true, userId: 'u1', email: 'e@e.com', ipAddress: 'ip' })
    expect(mockRefreshTokenRepository.claimForUse).toHaveBeenCalledWith('token-2')
    expect(mockRefreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith('u1')
  })

  it('afterCommit should audit-log the reuse-detected event only when result.reused is true', () => {
    const command = new RefreshCommand('token', 'ip', 'ua')
    const auditLogger = (handler as any).logger as jest.Mocked<ILogger>

    handler.afterCommit!(command, { reused: true, userId: 'u1', email: 'e@e.com', ipAddress: 'ip' })
    expect(auditLogger.warn).toHaveBeenCalled()
    ;(auditLogger.warn as jest.Mock).mockClear()
    handler.afterCommit!(command, {
      accessToken: { token: 'a', expiredAt: new Date() },
      refreshToken: { token: 'r', expiredAt: new Date() },
    })
    expect(auditLogger.warn).not.toHaveBeenCalled()
  })

  it('should generate new tokens and mark old as used on success', async () => {
    const command = new RefreshCommand('token', 'ip', 'ua')
    mockTokenService.verifyRefreshToken.mockReturnValue({
      tokenHash: 'hash',
      sub: 'u1',
      email: 'e@e.com',
    })

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

    const result = await handler.execute(command, tx)

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

    if (result.reused) throw new Error('expected a success result, got reused:true')
    expect(result.accessToken.token).toBe('access-token')
    expect(result.refreshToken.token).toBe('new-token')
  })

  it('should throw UserNotFoundError if user is not found in DB', async () => {
    const command = new RefreshCommand('token', 'ip', 'ua')
    mockTokenService.verifyRefreshToken.mockReturnValue({
      tokenHash: 'hash',
      sub: 'u1',
      email: 'e@e.com',
    })

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

    const mockUserRepo = mockUserRepository
    mockUserRepo.findByEmail.mockResolvedValueOnce(null)

    await expect(handler.execute(command, tx)).rejects.toThrow(UserNotFoundError)
  })

  it('should throw UserNotFoundError without querying the repository if the verified token payload has no email', async () => {
    const command = new RefreshCommand('token', 'ip', 'ua')
    mockTokenService.verifyRefreshToken.mockReturnValue({
      tokenHash: 'hash',
      sub: 'u1',
      email: null,
    })

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

    const mockUserRepo = mockUserRepository

    await expect(handler.execute(command, tx)).rejects.toThrow(UserNotFoundError)
    expect(mockUserRepo.findByEmail).not.toHaveBeenCalled()
  })
})
