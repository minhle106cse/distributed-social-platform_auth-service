import { GetRoleHandler } from './get-role.handler'
import { GetRoleQuery } from './get-role.query'
import type { IRoleQueryRepository } from '@/modules/rbac/application/queries/role.query-repository'
import { RoleNotFoundError } from '@/common/errors/rbac.error'

describe('GetRoleHandler', () => {
  let handler: GetRoleHandler
  let mockRoleQueryRepo: jest.Mocked<IRoleQueryRepository>

  beforeEach(() => {
    mockRoleQueryRepo = {
      getRoles: jest.fn(),
      getRoleByCode: jest.fn(),
    }

    handler = new GetRoleHandler(mockRoleQueryRepo)
  })

  it('should return a role by code', async () => {
    const query = new GetRoleQuery('ADMIN')
    const role = {
      code: 'ADMIN',
      nameRole: 'Admin',
      description: null,
      createdAt: new Date(),
      permissions: [],
    }

    mockRoleQueryRepo.getRoleByCode.mockResolvedValueOnce(role)

    const result = await handler.execute(query)

    expect(mockRoleQueryRepo.getRoleByCode).toHaveBeenCalledWith('ADMIN')
    expect(result).toEqual(role)
  })

  it('should throw RoleNotFoundError if role does not exist', async () => {
    const query = new GetRoleQuery('UNKNOWN')

    mockRoleQueryRepo.getRoleByCode.mockResolvedValueOnce(null)

    await expect(handler.execute(query)).rejects.toThrow(RoleNotFoundError)
  })
})
