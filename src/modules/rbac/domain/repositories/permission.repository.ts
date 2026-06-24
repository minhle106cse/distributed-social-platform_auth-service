import type { Permission } from '../entities/permission.entity'

export interface PermissionRepository {
  findPermissionByCode(code: string): Promise<Permission | null>
  findPermissionsByCodes(codes: string[]): Promise<Permission[]>
  getAllPermissions(): Promise<Permission[]>
  createPermission(permission: Permission): Promise<void>
  updatePermission(permission: Permission): Promise<void>
  deletePermission(id: string): Promise<void>
}
