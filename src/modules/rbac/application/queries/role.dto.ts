export interface RoleDto {
  code: string
  nameRole: string
  description: string | null
  createdAt: Date
  permissions: string[]
}
