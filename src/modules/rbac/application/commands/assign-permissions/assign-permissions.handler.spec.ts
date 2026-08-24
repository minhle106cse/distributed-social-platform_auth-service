import { SystemPermission } from '@distributed-social-platform/shared-kernel'
import type { IRoleRepository } from '../../../domain/repositories/role.repository'
import { AssignPermissionsHandler } from './assign-permissions.handler'
import { AssignPermissionsCommand } from './assign-permissions.command'
import type { AuthServiceRepos } from '@/container/repos'
import { RoleNotFoundError, InvalidPermissionCodeError } from '@/modules/rbac/domain/rbac.error'
import { Role } from '@/modules/rbac/domain/entities/role.entity'

describe('AssignPermissionsHandler', () => {
  let handler: AssignPermissionsHandler
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

    handler = new AssignPermissionsHandler()
    tx = { roles: mockRoleRepo } as unknown as AuthServiceRepos
  })

  it('should successfully assign permissions to a role', async () => {
    const command = new AssignPermissionsCommand('ADMIN', [
      SystemPermission.USER_READ,
      SystemPermission.USER_BAN,
    ])
    const role = Role.create({ code: 'ADMIN', name: 'Admin' })

    mockRoleRepo.findRoleByCode.mockResolvedValueOnce(role)
    mockRoleRepo.updateRole.mockResolvedValueOnce(undefined)

    const result = await handler.execute(command, tx)

    expect(mockRoleRepo.findRoleByCode).toHaveBeenCalledWith('ADMIN')
    expect(role.permissions).toEqual([SystemPermission.USER_READ, SystemPermission.USER_BAN])
    expect(mockRoleRepo.updateRole).toHaveBeenCalledWith(role)
    expect(result.permissions).toEqual([SystemPermission.USER_READ, SystemPermission.USER_BAN])
  })

  it('should throw RoleNotFoundError if role does not exist', async () => {
    const command = new AssignPermissionsCommand('ADMIN', [SystemPermission.USER_READ])

    mockRoleRepo.findRoleByCode.mockResolvedValueOnce(null)

    await expect(handler.execute(command, tx)).rejects.toThrow(RoleNotFoundError)
    expect(mockRoleRepo.updateRole).not.toHaveBeenCalled()
  })

  it('should throw InvalidPermissionCodeError if a code is not in the SystemPermission catalog', async () => {
    const command = new AssignPermissionsCommand('ADMIN', ['not:a_real_permission'])
    const role = Role.create({ code: 'ADMIN', name: 'Admin' })

    mockRoleRepo.findRoleByCode.mockResolvedValueOnce(role)

    await expect(handler.execute(command, tx)).rejects.toThrow(InvalidPermissionCodeError)
    expect(mockRoleRepo.updateRole).not.toHaveBeenCalled()
  })
})
