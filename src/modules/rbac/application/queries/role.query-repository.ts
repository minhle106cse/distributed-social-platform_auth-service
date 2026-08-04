import type { RoleDto } from './role.dto'

export interface IRoleQueryRepository {
  getRoles(): Promise<RoleDto[]>
  getRoleByCode(code: string): Promise<RoleDto | null>
}
