import { ProvisionUserHandler } from './provision-user.handler'
import { ProvisionUserCommand } from './provision-user.command'
import type { AuthServiceRepos } from '@/container/repos'
import type { IUserRepository } from '@/modules/user/domain/repositories/user.repository'
import type { IGrpcIdempotencyRepository } from '@/modules/auth/domain/repositories/grpc-idempotency.repository'
import type { IPasswordService } from '@/modules/auth/domain/services/password.service'
import { UserAlreadyExistsError, IdempotencyKeyConflictError } from '@/common/errors/user.error'
import { User } from '@/modules/user/domain/entities/user.entity'

jest.mock('uuid', () => ({
  v7: jest.fn(() => 'mock-uuid-v7'),
}))
jest.mock('@/modules/user/domain/entities/user.entity')

describe('ProvisionUserHandler', () => {
  let handler: ProvisionUserHandler
  let tx: AuthServiceRepos
  let mockUserRepo: jest.Mocked<IUserRepository>
  let mockGrpcIdempotencyRepo: jest.Mocked<IGrpcIdempotencyRepository>
  let mockPasswordService: jest.Mocked<IPasswordService>

  beforeEach(() => {
    // User.create is an auto-mock shared across the whole file (jest.mock at
    // module scope) — its call history otherwise accumulates across `it`
    // blocks, which the idempotency tests below need to be false about.
    jest.clearAllMocks()

    mockUserRepo = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      updateLocalPasswordHash: jest.fn(),
    } as unknown as jest.Mocked<IUserRepository>

    mockGrpcIdempotencyRepo = {
      findByKey: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    }

    mockPasswordService = {
      hash: jest.fn().mockResolvedValue('hashed-temp-password'),
      verify: jest.fn(),
    }

    handler = new ProvisionUserHandler(mockPasswordService)
    tx = {
      users: mockUserRepo,
      grpcIdempotency: mockGrpcIdempotencyRepo,
    } as unknown as AuthServiceRepos
  })

  it('should provision a new user with a server-generated random password', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null)

    const mockUserEntity = { id: 'provisioned-user-id', email: 'owner@example.com' } as User
    ;(User.create as jest.Mock).mockResolvedValue(mockUserEntity)

    const result = await handler.execute(new ProvisionUserCommand('owner@example.com'), tx)

    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('owner@example.com')
    expect(mockUserRepo.create).toHaveBeenCalledWith(mockUserEntity)
    expect(result.userId).toBe('provisioned-user-id')
    // Random, but must be non-trivial and NOT the plaintext email/anything
    // predictable — a fixed/short password here would defeat the point of
    // "server-generated" for an account whose credentials go straight to an
    // org owner over email.
    expect(result.temporaryPassword).toEqual(expect.any(String))
    expect(result.temporaryPassword.length).toBeGreaterThanOrEqual(16)
  })

  it('should pass the freshly generated temporaryPassword AND provisionedViaSaga:true into User.create', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null)
    const mockUserEntity = { id: 'u2', email: 'owner2@example.com' } as User
    ;(User.create as jest.Mock).mockResolvedValue(mockUserEntity)

    await handler.execute(new ProvisionUserCommand('owner2@example.com'), tx)

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'owner2@example.com',
        password: expect.any(String),
        provisionedViaSaga: true,
      }),
      mockPasswordService,
    )
  })

  it('should throw UserAlreadyExistsError if the email is already taken (saga caller maps this to ALREADY_EXISTS)', async () => {
    mockUserRepo.findByEmail.mockResolvedValue({} as User)

    await expect(
      handler.execute(new ProvisionUserCommand('taken@example.com'), tx),
    ).rejects.toThrow(UserAlreadyExistsError)

    expect(mockUserRepo.create).not.toHaveBeenCalled()
  })

  describe('idempotencyKey — recovering from a response lost after commit (ADR-0001 review, 2026-07-30)', () => {
    it('should NOT touch the idempotency store when no key is supplied (unchanged pre-existing behavior)', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null)
      const mockUserEntity = { id: 'u3', email: 'owner3@example.com' } as User
      ;(User.create as jest.Mock).mockResolvedValue(mockUserEntity)

      await handler.execute(new ProvisionUserCommand('owner3@example.com'), tx)

      expect(mockGrpcIdempotencyRepo.findByKey).not.toHaveBeenCalled()
      expect(mockGrpcIdempotencyRepo.create).not.toHaveBeenCalled()
    })

    it('should record the idempotency key atomically with a NEW user (first attempt)', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null)
      const mockUserEntity = { id: 'u4', email: 'owner4@example.com' } as User
      ;(User.create as jest.Mock).mockResolvedValue(mockUserEntity)

      await handler.execute(new ProvisionUserCommand('owner4@example.com', 'idem-key-1'), tx)

      expect(mockGrpcIdempotencyRepo.findByKey).toHaveBeenCalledWith('idem-key-1')
      expect(mockGrpcIdempotencyRepo.create).toHaveBeenCalledWith(
        'idem-key-1',
        'u4',
        'owner4@example.com',
        expect.any(Date),
      )
    })

    it('should re-issue a FRESH password for a repeated key instead of creating a second user', async () => {
      mockGrpcIdempotencyRepo.findByKey.mockResolvedValue({
        userId: 'existing-user-id',
        email: 'owner@example.com',
      })

      const result = await handler.execute(
        new ProvisionUserCommand('owner@example.com', 'idem-key-1'),
        tx,
      )

      expect(User.create).not.toHaveBeenCalled()
      expect(mockUserRepo.create).not.toHaveBeenCalled()
      expect(mockUserRepo.findByEmail).not.toHaveBeenCalled()
      expect(mockUserRepo.updateLocalPasswordHash).toHaveBeenCalledWith(
        'existing-user-id',
        'hashed-temp-password',
      )
      expect(result.userId).toBe('existing-user-id')
      expect(result.temporaryPassword).toEqual(expect.any(String))
    })

    it('should reject a key reused with a DIFFERENT email instead of reissuing a password for the wrong account', async () => {
      mockGrpcIdempotencyRepo.findByKey.mockResolvedValue({
        userId: 'existing-user-id',
        email: 'original-owner@example.com',
      })

      await expect(
        handler.execute(new ProvisionUserCommand('attacker@example.com', 'idem-key-1'), tx),
      ).rejects.toThrow(IdempotencyKeyConflictError)

      expect(mockUserRepo.updateLocalPasswordHash).not.toHaveBeenCalled()
      expect(User.create).not.toHaveBeenCalled()
    })

    it('should NEVER persist the temporary password in plaintext anywhere (repository only ever gets key/userId/email/expiresAt)', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null)
      const mockUserEntity = { id: 'u5', email: 'owner5@example.com' } as User
      ;(User.create as jest.Mock).mockResolvedValue(mockUserEntity)

      await handler.execute(new ProvisionUserCommand('owner5@example.com', 'idem-key-2'), tx)

      const [, , , fourthArg] = mockGrpcIdempotencyRepo.create.mock.calls[0]
      expect(fourthArg).toBeInstanceOf(Date)
      expect(mockGrpcIdempotencyRepo.create).toHaveBeenCalledWith(
        'idem-key-2',
        'u5',
        'owner5@example.com',
        expect.any(Date),
      )
    })
  })
})
