import type { ILogger } from '@distributed-social-platform/shared-kernel'
import { RegisterHandler } from './register.handler'
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository'
import type { PasswordService } from '@/modules/auth/domain/services/password.service'
import { UserAlreadyExistsError } from '@/common/errors/user.error'
import { User } from '@/modules/user/domain/entities/user.entity'

jest.mock('uuid', () => ({
  v7: jest.fn(() => 'mock-uuid-v7'),
}))
jest.mock('@/modules/user/domain/entities/user.entity')

describe('RegisterHandler', () => {
  let handler: RegisterHandler
  let mockUserRepo: jest.Mocked<UserRepository>
  let mockPasswordService: jest.Mocked<PasswordService>
  let mockAuditLogger: jest.Mocked<ILogger>

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

    mockAuditLogger = { info: jest.fn() } as unknown as jest.Mocked<ILogger>

    handler = new RegisterHandler(mockUserRepo, mockPasswordService, mockAuditLogger)
  })

  it('should register a new user successfully', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null) // No existing user

    const mockUserEntity = { id: 'new-user-id', email: 'new@example.com' } as User
    ;(User.create as jest.Mock).mockResolvedValue(mockUserEntity)

    const result = await handler.execute({
      email: 'new@example.com',
      password: 'password123',
      username: 'testuser',
    } as any)

    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('new@example.com')
    expect(User.create).toHaveBeenCalledWith(
      { email: 'new@example.com', password: 'password123' },
      mockPasswordService,
    )
    expect(mockUserRepo.create).toHaveBeenCalledWith(mockUserEntity)
    expect(result).toBeUndefined()
  })

  it('should throw UserAlreadyExistsError if email is taken', async () => {
    // Return a dummy object to simulate existing user
    mockUserRepo.findByEmail.mockResolvedValue({} as User)

    await expect(
      handler.execute({
        email: 'taken@example.com',
        password: 'pass',
        username: 'testuser',
      } as any),
    ).rejects.toThrow(UserAlreadyExistsError)

    expect(mockUserRepo.create).not.toHaveBeenCalled()
  })
})
