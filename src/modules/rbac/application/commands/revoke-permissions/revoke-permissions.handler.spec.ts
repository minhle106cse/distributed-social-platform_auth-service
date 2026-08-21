import type { IRoleRepository } from '../../../domain/repositories/role.repository'
import { RevokePermissionsHandler } from './revoke-permissions.handler'
import { RevokePermissionsCommand } from './revoke-permissions.command'
import type { AuthServiceRepos } from '@/container/repos'
import { RoleNotFoundError } from '@/common/errors/rbac.error'
import { Role } from '@/modules/rbac/domain/entities/role.entity'

describe('RevokePermissionsHandler', () => {
  let handler: RevokePermissionsHandler
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
    } as unknown as jest.Mocked<IRoleRepository>

    handler = new RevokePermissionsHandler()
    tx = { roles: mockRoleRepo } as unknown as AuthServiceRepos
  })

  it('should successfully revoke permissions from a role', async () => {
    const command = new RevokePermissionsCommand('ADMIN', ['READ_POSTS'])
    const role = Role.rehydrate({
      id: 'role-1',
      code: 'ADMIN',
      name: 'Admin',
      description: null,
      isActive: true,
      permissions: ['READ_POSTS', 'WRITE_POSTS'],
    })

    mockRoleRepo.findRoleByCode.mockResolvedValueOnce(role)
    mockRoleRepo.updateRole.mockResolvedValueOnce(undefined)

    await handler.execute(command, tx)

    expect(mockRoleRepo.findRoleByCode).toHaveBeenCalledWith('ADMIN')
    expect(role.permissions).toEqual(['WRITE_POSTS'])
    expect(mockRoleRepo.updateRole).toHaveBeenCalledWith(role)
  })

  it('should throw RoleNotFoundError if role does not exist', async () => {
    const command = new RevokePermissionsCommand('ADMIN', ['READ_POSTS'])

    mockRoleRepo.findRoleByCode.mockResolvedValueOnce(null)

    await expect(handler.execute(command, tx)).rejects.toThrow(RoleNotFoundError)
    expect(mockRoleRepo.updateRole).not.toHaveBeenCalled()
  })
})
