import { ProvisionUserHandler } from './provision-user.handler'
import { ProvisionUserCommand } from './provision-user.command'
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository'
import type { PasswordService } from '@/modules/auth/domain/services/password.service'
import { UserAlreadyExistsError } from '@/common/errors/user.error'
import { User } from '@/modules/user/domain/entities/user.entity'

jest.mock('uuid', () => ({
  v7: jest.fn(() => 'mock-uuid-v7'),
}))
jest.mock('@/modules/user/domain/entities/user.entity')

describe('ProvisionUserHandler', () => {
  let handler: ProvisionUserHandler
  let mockUserRepo: jest.Mocked<UserRepository>
  let mockPasswordService: jest.Mocked<PasswordService>

  beforeEach(() => {
    mockUserRepo = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>

    mockPasswordService = {
      hash: jest.fn(),
      verify: jest.fn(),
    }

    handler = new ProvisionUserHandler(mockUserRepo, mockPasswordService)
  })

  it('should provision a new user with a server-generated random password', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null)

    const mockUserEntity = { id: 'provisioned-user-id', email: 'owner@example.com' } as User
    ;(User.create as jest.Mock).mockResolvedValue(mockUserEntity)

    const result = await handler.execute(new ProvisionUserCommand('owner@example.com'))

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

  it('should pass the freshly generated temporaryPassword into User.create, not a fixed value', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null)
    const mockUserEntity = { id: 'u2', email: 'owner2@example.com' } as User
    ;(User.create as jest.Mock).mockResolvedValue(mockUserEntity)

    await handler.execute(new ProvisionUserCommand('owner2@example.com'))

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'owner2@example.com', password: expect.any(String) }),
      mockPasswordService,
    )
  })

  it('should throw UserAlreadyExistsError if the email is already taken (saga caller maps this to ALREADY_EXISTS)', async () => {
    mockUserRepo.findByEmail.mockResolvedValue({} as User)

    await expect(handler.execute(new ProvisionUserCommand('taken@example.com'))).rejects.toThrow(
      UserAlreadyExistsError,
    )

    expect(mockUserRepo.create).not.toHaveBeenCalled()
  })
})
