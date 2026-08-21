import type { RoleDto } from '../queries/role.dto'

export interface IRoleQueryRepository {
  getRoles(): Promise<RoleDto[]>
  getRoleByCode(code: string): Promise<RoleDto | null>
}
