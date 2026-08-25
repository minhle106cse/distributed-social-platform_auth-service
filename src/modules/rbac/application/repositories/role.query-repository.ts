import type { RoleDto } from '../queries/role.dto'
import type { RoleWithPermissions } from '@/common/rbac/resolve-system-permissions'

export interface IRoleQueryRepository {
  getRoles(): Promise<RoleDto[]>
  getRoleByCode(code: string): Promise<RoleDto | null>
  /**
   * The system roles actually held by one user, with their permission codes.
   * Returns [] for an unknown, deleted or inactive user — all of which mean
   * "no platform privileges", the same authorization answer.
   */
  findRolesByUserId(userId: string): Promise<RoleWithPermissions[]>
}
