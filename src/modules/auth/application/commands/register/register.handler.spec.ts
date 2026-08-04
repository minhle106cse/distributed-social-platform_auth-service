import type { AuthServiceRepos } from '@/container/repos'
import type { ILogger } from '@distributed-social-platform/shared-kernel'
import { RegisterHandler } from './register.handler'
import type { IUserRepository } from '@/modules/user/domain/repositories/user.repository'
import type { IPasswordService } from '@/modules/auth/domain/services/password.service'
import { UserAlreadyExistsError } from '@/common/errors/user.error'
import { User } from '@/modules/user/domain/entities/user.entity'

jest.mock('uuid', () => ({
  v7: jest.fn(() => 'mock-uuid-v7'),
}))
jest.mock('@/modules/user/domain/entities/user.entity')

describe('RegisterHandler', () => {
  let handler: RegisterHandler
  let tx: AuthServiceRepos
  let mockUserRepo: jest.Mocked<IUserRepository>
  let mockPasswordService: jest.Mocked<IPasswordService>
  let mockAuditLogger: jest.Mocked<ILogger>

  beforeEach(() => {
    mockUserRepo = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      updateLocalPasswordHash: jest.fn(),
    } as unknown as jest.Mocked<IUserRepository>

    mockPasswordService = {
      hash: jest.fn(),
      verify: jest.fn(),
    }

    mockAuditLogger = { info: jest.fn() } as unknown as jest.Mocked<ILogger>

    handler = new RegisterHandler(mockPasswordService, mockAuditLogger)
    tx = { users: mockUserRepo } as unknown as AuthServiceRepos
  })

  it('should register a new user successfully', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null) // No existing user

    const mockUserEntity = { id: 'new-user-id', email: 'new@example.com' } as User
    ;(User.create as jest.Mock).mockResolvedValue(mockUserEntity)

    const result = await handler.execute(
      {
        email: 'new@example.com',
        password: 'password123',
        username: 'testuser',
      } as any,
      tx,
    )

    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('new@example.com')
    expect(User.create).toHaveBeenCalledWith(
      { email: 'new@example.com', password: 'password123' },
      mockPasswordService,
    )
    expect(mockUserRepo.create).toHaveBeenCalledWith(mockUserEntity)
    expect(result).toEqual({ userId: 'new-user-id' })
    // Success audit must NOT fire from inside execute() — see afterCommit test
    // below (review of ADR-0001, 2026-07-30: it used to, and a commit-time
    // failure could make CommandBus.withRetry re-run this whole handler and log
    // a duplicate "success").
    expect(mockAuditLogger.info).not.toHaveBeenCalled()
  })

  it('afterCommit should log the success audit only once the transaction has committed', () => {
    handler.afterCommit({ email: 'new@example.com' } as any, { userId: 'new-user-id' })

    expect(mockAuditLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.register',
        outcome: 'success',
        actorUserId: 'new-user-id',
      }),
      expect.any(String),
    )
  })

  it('should throw UserAlreadyExistsError if email is taken', async () => {
    // Return a dummy object to simulate existing user
    mockUserRepo.findByEmail.mockResolvedValue({} as User)

    await expect(
      handler.execute(
        {
          email: 'taken@example.com',
          password: 'pass',
          username: 'testuser',
        } as any,
        tx,
      ),
    ).rejects.toThrow(UserAlreadyExistsError)

    expect(mockUserRepo.create).not.toHaveBeenCalled()
  })
})
