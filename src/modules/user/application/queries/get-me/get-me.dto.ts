export interface GetMeDto {
  id: string
  email: string
  isActive: boolean
  emailVerified: boolean
  createdAt: Date
  roles: string[]
  permissions: string[]
  profile: {
    firstName: string | null
    lastName: string | null
    displayName: string | null
    avatarUrl: string | null
    phoneNumber: string | null
  } | null
}
