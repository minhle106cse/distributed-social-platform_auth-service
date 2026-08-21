import type { Role } from '../entities/role.entity'

export interface IRoleRepository {
  findRoleByCode(code: string): Promise<Role | null>
  findRolesByCodes(codes: string[]): Promise<Role[]>
  getAllRoles(): Promise<Role[]>
  createRole(role: Role): Promise<void>
  updateRole(role: Role): Promise<void>
  deleteRole(id: string): Promise<void>
  // User assignment
  assignRoleToUser(userId: string, roleId: string): Promise<void>
  revokeRoleFromUser(userId: string, roleId: string): Promise<void>
}
