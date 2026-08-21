import { DeleteRoleHandler } from './delete-role.handler'
import { DeleteRoleCommand } from './delete-role.command'
import type { AuthServiceRepos } from '@/container/repos'
import type { IRoleRepository } from '@/modules/rbac/domain/repositories/role.repository'
import { RoleNotFoundError } from '@/common/errors/rbac.error'
import { Role } from '@/modules/rbac/domain/entities/role.entity'

describe('DeleteRoleHandler', () => {
  let handler: DeleteRoleHandler
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

    handler = new DeleteRoleHandler()
    tx = { roles: mockRoleRepo } as unknown as AuthServiceRepos
  })

  it('should successfully delete a role', async () => {
    const command = new DeleteRoleCommand('ADMIN')
    const role = Role.rehydrate({
      id: 'role-123',
      code: 'ADMIN',
      name: 'Admin',
      description: null,
      isActive: true,
      permissions: [],
    })

    mockRoleRepo.findRoleByCode.mockResolvedValueOnce(role)
    mockRoleRepo.deleteRole.mockResolvedValueOnce(undefined)

    await handler.execute(command, tx)

    expect(mockRoleRepo.findRoleByCode).toHaveBeenCalledWith('ADMIN')
    expect(mockRoleRepo.deleteRole).toHaveBeenCalledWith('role-123')
  })

  it('should throw RoleNotFoundError if role does not exist', async () => {
    const command = new DeleteRoleCommand('ADMIN')

    mockRoleRepo.findRoleByCode.mockResolvedValueOnce(null)

    await expect(handler.execute(command, tx)).rejects.toThrow(RoleNotFoundError)
    expect(mockRoleRepo.deleteRole).not.toHaveBeenCalled()
  })
})
