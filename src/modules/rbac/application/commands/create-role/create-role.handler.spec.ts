import type { IRoleRepository } from '../../../domain/repositories/role.repository'
import { CreateRoleHandler } from './create-role.handler'
import { CreateRoleCommand } from './create-role.command'
import type { AuthServiceRepos } from '@/container/repos'
import { RoleAlreadyExistsError } from '@/common/errors/rbac.error'
import { Role } from '@/modules/rbac/domain/entities/role.entity'

describe('CreateRoleHandler', () => {
  let handler: CreateRoleHandler
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

    handler = new CreateRoleHandler()
    tx = { roles: mockRoleRepo } as unknown as AuthServiceRepos
  })

  it('should successfully create a role', async () => {
    const command = new CreateRoleCommand('ADMIN', 'Administrator', 'Admin role description')

    mockRoleRepo.findRoleByCode.mockResolvedValueOnce(null)
    mockRoleRepo.createRole.mockResolvedValueOnce(undefined)

    const result = await handler.execute(command, tx)

    expect(mockRoleRepo.findRoleByCode).toHaveBeenCalledWith('ADMIN')
    expect(mockRoleRepo.createRole).toHaveBeenCalled()
    expect(result.code).toBe('ADMIN')
    expect(result.id).toBeDefined()
  })

  it('should throw RoleAlreadyExistsError if role code is taken', async () => {
    const command = new CreateRoleCommand('ADMIN', 'Administrator', 'Admin role description')

    mockRoleRepo.findRoleByCode.mockResolvedValueOnce(Role.create({ code: 'ADMIN', name: 'Admin' }))

    await expect(handler.execute(command, tx)).rejects.toThrow(RoleAlreadyExistsError)
    expect(mockRoleRepo.createRole).not.toHaveBeenCalled()
  })
})
