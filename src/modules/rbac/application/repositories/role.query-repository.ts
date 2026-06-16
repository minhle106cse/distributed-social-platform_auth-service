export interface RoleDto {
  code: string
  nameRole: string
  description: string | null
  createdAt: Date
  permissions: string[]
}

export interface RoleQueryRepository {
  getRoles(): Promise<RoleDto[]>
  getRoleByCode(code: string): Promise<RoleDto | null>
}
