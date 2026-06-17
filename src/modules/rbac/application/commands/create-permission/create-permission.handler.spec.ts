import { CreatePermissionHandler } from './create-permission.handler';
import { CreatePermissionCommand } from './create-permission.command';
import { PermissionRepository } from '../../../domain/repositories/permission.repository';
import { PermissionAlreadyExistsError } from '@/common/errors/rbac.error';
import { Permission } from '@/modules/rbac/domain/entities/permission.entity';

describe('CreatePermissionHandler', () => {
  let handler: CreatePermissionHandler;
  let mockPermissionRepo: jest.Mocked<PermissionRepository>;

  beforeEach(() => {
    mockPermissionRepo = {
      createPermission: jest.fn(),
      findPermissionByCode: jest.fn(),
      findPermissionsByCodes: jest.fn(),
      findAllPermissions: jest.fn(),
    } as unknown as jest.Mocked<PermissionRepository>;

    handler = new CreatePermissionHandler(mockPermissionRepo);
  });

  it('should successfully create a permission', async () => {
    const command = new CreatePermissionCommand('READ_POSTS', 'POST', 'Can read posts');

    mockPermissionRepo.findPermissionByCode.mockResolvedValueOnce(null);
    mockPermissionRepo.createPermission.mockResolvedValueOnce(undefined);

    const result = await handler.execute(command);

    expect(mockPermissionRepo.findPermissionByCode).toHaveBeenCalledWith('READ_POSTS');
    expect(mockPermissionRepo.createPermission).toHaveBeenCalled();
    expect(result.code).toBe('READ_POSTS');
    expect(result.id).toBeDefined();
  });

  it('should throw PermissionAlreadyExistsError if permission code is taken', async () => {
    const command = new CreatePermissionCommand('READ_POSTS', 'POST');

    mockPermissionRepo.findPermissionByCode.mockResolvedValueOnce(Permission.create({ code: 'READ_POSTS', module: 'POST' }));

    await expect(handler.execute(command)).rejects.toThrow(PermissionAlreadyExistsError);
    expect(mockPermissionRepo.createPermission).not.toHaveBeenCalled();
  });
});
