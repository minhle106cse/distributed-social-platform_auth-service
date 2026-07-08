import type { RoleDto } from './role.dto'

export interface RoleQueryRepository {
  getRoles(): Promise<RoleDto[]>
  getRoleByCode(code: string): Promise<RoleDto | null>
}
