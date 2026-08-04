import { GetMeHandler } from './get-me.handler'
import { GetMeQuery } from './get-me.query'
import type { IUserQueryRepository } from '@/modules/user/application/queries/user.query-repository'
import { UserNotFoundError } from '@/common/errors/user.error'

describe('GetMeHandler', () => {
  let handler: GetMeHandler
  let mockUserQueryRepository: jest.Mocked<IUserQueryRepository>

  beforeEach(() => {
    mockUserQueryRepository = {
      getMe: jest.fn(),
    }

    handler = new GetMeHandler(mockUserQueryRepository)
  })

  it('should throw UserNotFoundError if user is not found', async () => {
    const query = new GetMeQuery('user-1')
    mockUserQueryRepository.getMe.mockResolvedValueOnce(null)

    await expect(handler.execute(query)).rejects.toThrow(UserNotFoundError)
    expect(mockUserQueryRepository.getMe).toHaveBeenCalledWith('user-1')
  })

  it('should throw UserCannotLoginError if user is inactive', async () => {
    const query = new GetMeQuery('user-1')
    mockUserQueryRepository.getMe.mockResolvedValueOnce({
      id: 'user-1',
      email: 'test@example.com',
      isActive: false,
      emailVerified: true,
      createdAt: new Date(),
      roles: [],
      permissions: [],
      profile: null,
    })

    await expect(handler.execute(query)).rejects.toThrow(
      require('@/common/errors/user.error').UserCannotLoginError,
    )
  })

  it('should return user dto if found', async () => {
    const query = new GetMeQuery('user-1')
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      roles: [],
      permissions: [],
      profile: null,
    }
    mockUserQueryRepository.getMe.mockResolvedValueOnce(mockUser)

    const result = await handler.execute(query)

    expect(result).toEqual(mockUser)
  })
})
