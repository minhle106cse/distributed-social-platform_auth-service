import type { RoleRepository } from '../../../domain/repositories/role.repository'
import type { PermissionRepository } from '../../../domain/repositories/permission.repository'
import { AssignPermissionsHandler } from './assign-permissions.handler'
import { AssignPermissionsCommand } from './assign-permissions.command'
import { RoleNotFoundError, PermissionInactiveError } from '@/common/errors/rbac.error'
import { Role } from '@/modules/rbac/domain/entities/role.entity'
import { Permission } from '@/modules/rbac/domain/entities/permission.entity'

describe('AssignPermissionsHandler', () => {
  let handler: AssignPermissionsHandler
  let mockRoleRepo: jest.Mocked<RoleRepository>
  let mockPermissionRepo: jest.Mocked<PermissionRepository>

  beforeEach(() => {
    mockRoleRepo = {
      createRole: jest.fn(),
      findRoleByCode: jest.fn(),
      findRoleById: jest.fn(),
      findAllRoles: jest.fn(),
      updateRole: jest.fn(),
      deleteRole: jest.fn(),
    } as unknown as jest.Mocked<RoleRepository>

    mockPermissionRepo = {
      createPermission: jest.fn(),
      findPermissionByCode: jest.fn(),
      findPermissionsByCodes: jest.fn(),
      findAllPermissions: jest.fn(),
    } as unknown as jest.Mocked<PermissionRepository>

    handler = new AssignPermissionsHandler(mockRoleRepo, mockPermissionRepo)
  })

  it('should successfully assign permissions to a role', async () => {
    const command = new AssignPermissionsCommand('ADMIN', ['READ_POSTS', 'WRITE_POSTS'])
    const role = Role.create({ code: 'ADMIN', name: 'Admin' })

    const perm1 = Permission.create({ code: 'READ_POSTS', module: 'POST' })
    const perm2 = Permission.create({ code: 'WRITE_POSTS', module: 'POST' })

    mockRoleRepo.findRoleByCode.mockResolvedValueOnce(role)
    mockPermissionRepo.findPermissionsByCodes.mockResolvedValueOnce([perm1, perm2])
    mockRoleRepo.updateRole.mockResolvedValueOnce(undefined)

    const result = await handler.execute(command)

    expect(mockRoleRepo.findRoleByCode).toHaveBeenCalledWith('ADMIN')
    expect(mockPermissionRepo.findPermissionsByCodes).toHaveBeenCalledWith([
      'READ_POSTS',
      'WRITE_POSTS',
    ])
    expect(role.getPermissions).toEqual(['READ_POSTS', 'WRITE_POSTS'])
    expect(mockRoleRepo.updateRole).toHaveBeenCalledWith(role)
    expect(result.permissions).toEqual(['READ_POSTS', 'WRITE_POSTS'])
  })

  it('should throw RoleNotFoundError if role does not exist', async () => {
    const command = new AssignPermissionsCommand('ADMIN', ['READ_POSTS'])

    mockRoleRepo.findRoleByCode.mockResolvedValueOnce(null)

    await expect(handler.execute(command)).rejects.toThrow(RoleNotFoundError)
    expect(mockRoleRepo.updateRole).not.toHaveBeenCalled()
  })

  it('should throw PermissionInactiveError if any permission is inactive', async () => {
    const command = new AssignPermissionsCommand('ADMIN', ['READ_POSTS'])
    const role = Role.create({ code: 'ADMIN', name: 'Admin' })

    const perm1 = Permission.rehydrate({
      id: 'p1',
      code: 'READ_POSTS',
      module: 'POST',
      description: null,
      isActive: false,
    })

    mockRoleRepo.findRoleByCode.mockResolvedValueOnce(role)
    mockPermissionRepo.findPermissionsByCodes.mockResolvedValueOnce([perm1])

    await expect(handler.execute(command)).rejects.toThrow(PermissionInactiveError)
    expect(mockRoleRepo.updateRole).not.toHaveBeenCalled()
  })
})
