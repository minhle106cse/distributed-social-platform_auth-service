import { GetMeHandler } from './get-me.handler'
import type { UserQueryRepository } from '@/modules/auth/application/repositories/user.query-repository'
import { GetMeQuery } from './get-me.query'
import { UserNotFoundError } from '@/common/errors/auth.error'

describe('GetMeHandler', () => {
  let handler: GetMeHandler
  let mockUserQueryRepository: jest.Mocked<UserQueryRepository>

  beforeEach(() => {
    mockUserQueryRepository = {
      getMe: jest.fn(),
    } as any

    handler = new GetMeHandler(mockUserQueryRepository)
  })

  it('should throw UserNotFoundError if user is not found', async () => {
    const query = new GetMeQuery('user-1')
    mockUserQueryRepository.getMe.mockResolvedValueOnce(null)

    await expect(handler.execute(query)).rejects.toThrow(UserNotFoundError)
    expect(mockUserQueryRepository.getMe).toHaveBeenCalledWith('user-1')
  })

  it('should return user dto if found', async () => {
    const query = new GetMeQuery('user-1')
    const userDto = {
      id: 'user-1',
      email: 'test@example.com',
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
    }
    mockUserQueryRepository.getMe.mockResolvedValueOnce(userDto)

    const result = await handler.execute(query)

    expect(result).toEqual(userDto)
  })
})
