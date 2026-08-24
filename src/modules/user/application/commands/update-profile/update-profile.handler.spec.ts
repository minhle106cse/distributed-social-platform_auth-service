import type { IUserRepository } from '../../../domain/repositories/user.repository'
import { User } from '../../../domain/entities/user.entity'
import { UserProfile } from '../../../domain/entities/user-profile.entity'
import { UpdateProfileCommand } from './update-profile.command'
import { UpdateProfileHandler } from './update-profile.handler'
import type { AuthServiceRepos } from '@/container/repos'
import { UserNotFoundError } from '@/modules/user/domain/user.error'

describe('UpdateProfileHandler', () => {
  let handler: UpdateProfileHandler
  let tx: AuthServiceRepos
  let mockUserRepo: jest.Mocked<IUserRepository>

  beforeEach(() => {
    mockUserRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      hardDelete: jest.fn(),
      updateLocalPasswordHash: jest.fn(),
    }
    handler = new UpdateProfileHandler()
    tx = { users: mockUserRepo } as unknown as AuthServiceRepos
  })

  it('should update profile when user exists', async () => {
    const userId = 'user-123'
    const command = new UpdateProfileCommand(
      userId,
      'Jane',
      'Doe',
      'Jane Doe',
      'https://avatar.com/jane.jpg',
      '123456789',
    )

    const mockUser = User.rehydrate({
      id: userId,
      email: 'test@example.com',
      isActive: true,
      emailVerified: true,
      authIdentities: [],
    })

    mockUserRepo.findById.mockResolvedValue(mockUser)

    const result = await handler.execute(command, tx)

    expect(mockUserRepo.findById).toHaveBeenCalledWith(userId)
    expect(mockUserRepo.save).toHaveBeenCalled()
    const savedUser = mockUserRepo.save.mock.calls[0][0]
    const profile = savedUser.profile
    expect(profile).toBeDefined()
    expect(profile?.firstName).toBe('Jane')
    expect(profile?.lastName).toBe('Doe')
    expect(profile?.displayName).toBe('Jane Doe')
    expect(profile?.avatarUrl).toBe('https://avatar.com/jane.jpg')
    expect(profile?.phoneNumber).toBe('123456789')

    expect(result).toEqual({ success: true })
  })

  it('should update profile when user already has a profile', async () => {
    const userId = 'user-123'
    const command = new UpdateProfileCommand(
      userId,
      'Jane',
      'Doe',
      'Jane Doe',
      'https://avatar.com/jane.jpg',
      '123456789',
    )

    const mockUser = User.rehydrate({
      id: userId,
      email: 'test@example.com',
      isActive: true,
      emailVerified: true,
      authIdentities: [],
    })

    const existingProfile = UserProfile.rehydrate({
      id: 'p1',
      userId,
      firstName: 'Old',
      lastName: 'Name',
      displayName: null,
      avatarUrl: null,
      phoneNumber: null,
    })
    mockUser.assignProfile(existingProfile)

    mockUserRepo.findById.mockResolvedValue(mockUser)

    const result = await handler.execute(command, tx)

    expect(mockUserRepo.findById).toHaveBeenCalledWith(userId)
    expect(mockUserRepo.save).toHaveBeenCalled()
    const savedUser = mockUserRepo.save.mock.calls[0][0]
    const profile = savedUser.profile
    expect(profile).toBeDefined()
    expect(profile?.firstName).toBe('Jane')
    expect(profile?.lastName).toBe('Doe')

    expect(result).toEqual({ success: true })
  })

  it('should throw UserNotFoundError when user does not exist', async () => {
    const command = new UpdateProfileCommand('user-123', 'Jane', 'Doe')

    mockUserRepo.findById.mockResolvedValue(null)

    await expect(handler.execute(command, tx)).rejects.toThrow(UserNotFoundError)
    expect(mockUserRepo.findById).toHaveBeenCalledWith('user-123')
    expect(mockUserRepo.save).not.toHaveBeenCalled()
  })
})
