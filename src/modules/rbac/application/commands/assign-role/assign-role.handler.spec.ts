import type { IRoleRepository } from '../../../domain/repositories/role.repository'
import { AssignRoleHandler } from './assign-role.handler'
import { AssignRoleCommand } from './assign-role.command'
import type { AuthServiceRepos } from '@/container/repos'
import { RoleNotFoundError, RoleInactiveError } from '@/common/errors/rbac.error'
import { Role } from '@/modules/rbac/domain/entities/role.entity'

describe('AssignRoleHandler', () => {
  let handler: AssignRoleHandler
  let tx: AuthServiceRepos
  let mockRoleRepo: jest.Mocked<IRoleRepository>

  beforeEach(() => {
    mockRoleRepo = {
      createRole: jest.fn(),
      findRoleByCode: jest.fn(),
      findRoleById: jest.fn(),
      findAllRoles: jest.fn(),
      updateRole: jest.fn(),
      deleteRole: jest.fn(),
      assignRoleToUser: jest.fn(),
    } as unknown as jest.Mocked<IRoleRepository>

    handler = new AssignRoleHandler()
    tx = { roles: mockRoleRepo } as unknown as AuthServiceRepos
  })

  it('should successfully assign a role to a user', async () => {
    const command = new AssignRoleCommand('user-1', 'ADMIN')
    const role = Role.rehydrate({
      id: 'role-1',
      code: 'ADMIN',
      name: 'Admin',
      description: null,
      isActive: true,
      permissions: [],
    })

    mockRoleRepo.findRoleByCode.mockResolvedValueOnce(role)
    mockRoleRepo.assignRoleToUser.mockResolvedValueOnce(undefined)

    const result = await handler.execute(command, tx)

    expect(mockRoleRepo.findRoleByCode).toHaveBeenCalledWith('ADMIN')
    expect(mockRoleRepo.assignRoleToUser).toHaveBeenCalledWith('user-1', 'role-1')
    expect(result.success).toBe(true)
  })

  it('should throw RoleNotFoundError if role does not exist', async () => {
    const command = new AssignRoleCommand('user-1', 'ADMIN')

    mockRoleRepo.findRoleByCode.mockResolvedValueOnce(null)

    await expect(handler.execute(command, tx)).rejects.toThrow(RoleNotFoundError)
    expect(mockRoleRepo.assignRoleToUser).not.toHaveBeenCalled()
  })

  it('should throw RoleInactiveError if role is inactive', async () => {
    const command = new AssignRoleCommand('user-1', 'ADMIN')
    const role = Role.rehydrate({
      id: 'role-1',
      code: 'ADMIN',
      name: 'Admin',
      description: null,
      isActive: false,
      permissions: [],
    })

    mockRoleRepo.findRoleByCode.mockResolvedValueOnce(role)

    await expect(handler.execute(command, tx)).rejects.toThrow(RoleInactiveError)
    expect(mockRoleRepo.assignRoleToUser).not.toHaveBeenCalled()
  })
})
