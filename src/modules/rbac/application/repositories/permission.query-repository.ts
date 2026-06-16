export interface PermissionDto {
  code: string
  moduleName: string
  description: string | null
  createdAt: Date
}

export interface PermissionQueryRepository {
  getPermissions(): Promise<PermissionDto[]>
}
