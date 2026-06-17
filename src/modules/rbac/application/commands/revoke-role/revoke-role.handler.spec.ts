import { RevokeRoleHandler } from './revoke-role.handler';
import { RevokeRoleCommand } from './revoke-role.command';
import { RoleRepository } from '@/modules/rbac/domain/repositories/role.repository';
import { RoleNotFoundError } from '@/common/errors/rbac.error';
import { Role } from '@/modules/rbac/domain/entities/role.entity';

describe('RevokeRoleHandler', () => {
  let handler: RevokeRoleHandler;
  let mockRoleRepo: jest.Mocked<RoleRepository>;

  beforeEach(() => {
    mockRoleRepo = {
      createRole: jest.fn(),
      findRoleByCode: jest.fn(),
      findRoleById: jest.fn(),
      findAllRoles: jest.fn(),
      updateRole: jest.fn(),
      deleteRole: jest.fn(),
      assignRoleToUser: jest.fn(),
      revokeRoleFromUser: jest.fn(),
    } as unknown as jest.Mocked<RoleRepository>;

    handler = new RevokeRoleHandler(mockRoleRepo);
  });

  it('should successfully revoke a role from a user', async () => {
    const command = new RevokeRoleCommand('user-1', 'ADMIN');
    const role = Role.rehydrate({ id: 'role-1', code: 'ADMIN', name: 'Admin', description: null, isActive: true, permissions: [] });

    mockRoleRepo.findRoleByCode.mockResolvedValueOnce(role);
    mockRoleRepo.revokeRoleFromUser.mockResolvedValueOnce(undefined);

    await handler.execute(command);

    expect(mockRoleRepo.findRoleByCode).toHaveBeenCalledWith('ADMIN');
    expect(mockRoleRepo.revokeRoleFromUser).toHaveBeenCalledWith('user-1', 'role-1');
  });

  it('should throw RoleNotFoundError if role does not exist', async () => {
    const command = new RevokeRoleCommand('user-1', 'ADMIN');

    mockRoleRepo.findRoleByCode.mockResolvedValueOnce(null);

    await expect(handler.execute(command)).rejects.toThrow(RoleNotFoundError);
    expect(mockRoleRepo.revokeRoleFromUser).not.toHaveBeenCalled();
  });
});
