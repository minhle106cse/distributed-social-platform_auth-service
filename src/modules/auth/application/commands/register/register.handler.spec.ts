import { RegisterHandler } from './register.handler'
import { UserRepository } from '@/modules/auth/domain/repositories/user.repository'
import { PasswordService } from '@/modules/auth/domain/services/password.service'
import { UserAlreadyExistsError } from '@/errors/auth.error'
import { User } from '@/modules/auth/domain/entities/user.entity'

jest.mock('uuid', () => ({
  v7: jest.fn(() => 'mock-uuid-v7')
}))
jest.mock('@/modules/auth/domain/entities/user.entity')

describe('RegisterHandler', () => {
  let handler: RegisterHandler
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
    } as unknown as jest.Mocked<PasswordService>

    handler = new RegisterHandler(mockUserRepo, mockPasswordService)
  })

  it('should register a new user successfully', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null) // No existing user

    const mockUserEntity = { id: 'new-user-id', email: 'new@example.com' } as User
    ;(User.createForRegister as jest.Mock).mockResolvedValue(mockUserEntity)

    const result = await handler.execute({
      email: 'new@example.com',
      password: 'password123',
      fullName: 'Test User'
    })

    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('new@example.com')
    expect(User.createForRegister).toHaveBeenCalledWith(
      { email: 'new@example.com', password: 'password123', fullName: 'Test User' },
      mockPasswordService
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
        fullName: 'Test'
      })
    ).rejects.toThrow(UserAlreadyExistsError)

    expect(mockUserRepo.create).not.toHaveBeenCalled()
  })
})
