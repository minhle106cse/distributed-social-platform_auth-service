import type { ILogger } from '@distributed-social-platform/shared-kernel'
import { LoginHandler } from './login.handler'
import type { AuthServiceRepos } from '@/container/repos'
import type { IUserRepository } from '@/modules/user/domain/repositories/user.repository'
import type { IRefreshTokenRepository } from '@/modules/auth/domain/repositories/refresh-token.repository'
import type { IPasswordService } from '@/modules/auth/domain/services/password.service'
import type { ITokenService } from '@/modules/auth/domain/services/token.service'
import { InvalidCredentialsError } from '@/modules/auth/domain/auth.error'
import { UserCannotLoginError } from '@/modules/user/domain/user.error'
import { User } from '@/modules/user/domain/entities/user.entity'
import { AuthIdentity } from '@/modules/auth/domain/value-objects/auth-identity.vo'
import { RefreshToken } from '@/modules/auth/domain/entities/refresh-token.entity'

jest.mock('uuid', () => ({
  v7: jest.fn(() => 'mock-uuid-v7'),
}))
jest.mock('@/modules/auth/domain/entities/refresh-token.entity')

describe('LoginHandler', () => {
  let handler: LoginHandler
  let tx: AuthServiceRepos
  let mockUserRepo: jest.Mocked<IUserRepository>
  let mockRefreshTokenRepo: jest.Mocked<IRefreshTokenRepository>
  let mockPasswordService: jest.Mocked<IPasswordService>
  let mockTokenService: jest.Mocked<ITokenService>
  let mockAuditLogger: jest.Mocked<ILogger>

  beforeEach(() => {
    mockUserRepo = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      hardDelete: jest.fn(),
      updateLocalPasswordHash: jest.fn(),
    }

    mockRefreshTokenRepo = {
      create: jest.fn(),
      findByToken: jest.fn(),
      revoke: jest.fn(),
      revokeAllUserTokens: jest.fn(),
    } as unknown as jest.Mocked<IRefreshTokenRepository>

    mockPasswordService = {
      hash: jest.fn(),
      verify: jest.fn(),
    }

    mockTokenService = {
      signAccessToken: jest.fn(),
      signRefreshToken: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    } as unknown as jest.Mocked<ITokenService>

    mockAuditLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    }

    handler = new LoginHandler(mockPasswordService, mockTokenService, mockAuditLogger)
    tx = { users: mockUserRepo, refreshTokens: mockRefreshTokenRepo } as unknown as AuthServiceRepos
  })

  it('should successfully login and return tokens', async () => {
    // Setup Mock User
    const authIdentity = AuthIdentity.create('hashed-pass')
    const user = User.rehydrate({
      id: 'user-id',
      email: 'test@example.com',
      isActive: true,
      emailVerified: true,
      authIdentities: [authIdentity],
    })

    // Mock user repo finding user
    mockUserRepo.findByEmail.mockResolvedValue(user)

    // Mock password comparison (must be true)
    mockPasswordService.verify.mockResolvedValue(true)

    // Mock RefreshToken creation
    const mockRefreshTokenEntity = { expiredAt: new Date(Date.now() + 10000) } as RefreshToken
    ;(RefreshToken.create as jest.Mock).mockReturnValue({
      refreshToken: 'mock-refresh-token',
      refreshTokenEntity: mockRefreshTokenEntity,
    })

    // Mock AccessToken generation
    mockTokenService.signAccessToken.mockReturnValue({
      token: 'mock-access-token',
      expiredAt: new Date(Date.now() + 5000),
    })

    const result = await handler.execute(
      {
        email: 'test@example.com',
        password: 'plain-pass',
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      } as any,
      tx,
    )

    // Assertions
    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('test@example.com', true)
    expect(mockPasswordService.verify).toHaveBeenCalledWith('plain-pass', 'hashed-pass')
    expect(mockRefreshTokenRepo.create).toHaveBeenCalledWith(mockRefreshTokenEntity)
    expect(mockTokenService.signAccessToken).toHaveBeenCalledWith({
      sub: 'user-id',
      email: 'test@example.com',
      roles: [],
      permissions: [],
    })

    expect(result.accessToken.token).toBe('mock-access-token')
    expect(result.refreshToken.token).toBe('mock-refresh-token')
    expect(result.userId).toBe('user-id')
    // Success audit must NOT fire from inside execute() — see afterCommit test
    // below. A commit-time Prisma failure would otherwise make CommandBus.withRetry
    // re-run this whole handler and log a duplicate "success" (review of
    // ADR-0001, 2026-07-30).
    expect(mockAuditLogger.info).not.toHaveBeenCalled()
  })

  it('afterCommit should log the success audit only once the transaction has committed', () => {
    handler.afterCommit({ email: 'test@example.com', ipAddress: '127.0.0.1' } as any, {
      userId: 'user-id',
    })

    expect(mockAuditLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.login',
        outcome: 'success',
        actorUserId: 'user-id',
        ip: '127.0.0.1',
      }),
      expect.any(String),
    )
  })

  it('should throw InvalidCredentialsError if user is not found', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null)

    await expect(
      handler.execute(
        {
          email: 'notfound@example.com',
          password: 'pass',
        } as any,
        tx,
      ),
    ).rejects.toThrow(InvalidCredentialsError)
  })

  it('should throw InvalidCredentialsError (not AuthMethodNotFoundError) if user exists but has no LOCAL identity (OAuth-only) — prevents user enumeration', async () => {
    const user = User.rehydrate({
      id: 'user-id',
      email: 'oauth-only@example.com',
      isActive: true,
      emailVerified: true,
      authIdentities: [], // no LOCAL identity — signed up via OAuth
    })

    mockUserRepo.findByEmail.mockResolvedValue(user)

    await expect(
      handler.execute(
        {
          email: 'oauth-only@example.com',
          password: 'pass',
        } as any,
        tx,
      ),
    ).rejects.toThrow(InvalidCredentialsError)
  })

  it('should throw if user is inactive', async () => {
    const user = User.rehydrate({
      id: 'user-id',
      email: 'test@example.com',
      isActive: false, // Inactive!
      emailVerified: true,
      authIdentities: [],
    })

    mockUserRepo.findByEmail.mockResolvedValue(user)

    await expect(
      handler.execute(
        {
          email: 'test@example.com',
          password: 'pass',
        } as any,
        tx,
      ),
    ).rejects.toThrow(UserCannotLoginError)
  })

  it('should auto-restore user if they were soft-deleted', async () => {
    const authIdentity = AuthIdentity.create('hashed-pass')
    const user = User.rehydrate({
      id: 'user-id',
      email: 'test@example.com',
      isActive: true,
      emailVerified: true,
      authIdentities: [authIdentity],
      deletedAt: new Date(), // Soft deleted
    })

    mockUserRepo.findByEmail.mockResolvedValue(user)
    mockPasswordService.verify.mockResolvedValue(true)
    mockUserRepo.save.mockResolvedValue()
    ;(RefreshToken.create as jest.Mock).mockReturnValue({
      refreshToken: 'mock-refresh-token',
      refreshTokenEntity: { expiredAt: new Date() } as RefreshToken,
    })

    mockTokenService.signAccessToken.mockReturnValue({ token: 'access', expiredAt: new Date() })

    await handler.execute(
      {
        email: 'test@example.com',
        password: 'plain-pass',
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      } as any,
      tx,
    )

    expect(user.isDeleted()).toBe(false)
    expect(mockUserRepo.save).toHaveBeenCalledWith(user)
  })
})
