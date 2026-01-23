export interface LoginCommand {
  email: string
  password: string
  ipAddress: string | null
  userAgent: string | null
}