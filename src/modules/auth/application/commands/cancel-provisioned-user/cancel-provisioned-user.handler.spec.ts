import type { AuthServiceRepos } from '@/container/repos'
import { CancelProvisionedUserHandler } from './cancel-provisioned-user.handler'
import { CancelProvisionedUserCommand } from './cancel-provisioned-user.command'
import type { IUserRepository } from '@/modules/user/domain/repositories/user.repository'
import { User } from '@/modules/user/domain/entities/user.entity'

describe('CancelProvisionedUserHandler', () => {
  let handler: CancelProvisionedUserHandler
  let tx: AuthServiceRepos
  let mockUserRepo: jest.Mocked<IUserRepository>

  beforeEach(() => {
    mockUserRepo = {
      findById: jest.fn(),
      hardDelete: jest.fn(),
      updateLocalPasswordHash: jest.fn(),
    } as unknown as jest.Mocked<IUserRepository>

    handler = new CancelProvisionedUserHandler()
    tx = { users: mockUserRepo } as unknown as AuthServiceRepos
  })

  it('should return cancelled:false without deleting anything if the user does not exist', async () => {
    mockUserRepo.findById.mockResolvedValue(null)

    const result = await handler.execute(new CancelProvisionedUserCommand('missing-id'), tx)

    expect(result).toEqual({ cancelled: false })
    expect(mockUserRepo.hardDelete).not.toHaveBeenCalled()
  })

  it('should hard-delete and return cancelled:true for a freshly provisioned user (emailVerified=false, untouched)', async () => {
    const user = User.rehydrate({
      id: 'provisioned-id',
      email: 'owner@example.com',
      isActive: true,
      emailVerified: false,
      authIdentities: [],
    })
    mockUserRepo.findById.mockResolvedValue(user)

    const result = await handler.execute(new CancelProvisionedUserCommand('provisioned-id'), tx)

    expect(mockUserRepo.hardDelete).toHaveBeenCalledWith('provisioned-id')
    expect(result).toEqual({ cancelled: true })
  })

  it('should refuse to delete (cancelled:false) if the user already activated (emailVerified=true) — race guard against removing a real account', async () => {
    const user = User.rehydrate({
      id: 'activated-id',
      email: 'owner@example.com',
      isActive: true,
      emailVerified: true, // activated in the window between provision and this compensating call
      authIdentities: [],
    })
    mockUserRepo.findById.mockResolvedValue(user)

    const result = await handler.execute(new CancelProvisionedUserCommand('activated-id'), tx)

    expect(result).toEqual({ cancelled: false })
    expect(mockUserRepo.hardDelete).not.toHaveBeenCalled()
  })
})
